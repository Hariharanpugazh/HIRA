import argparse
import json
from pathlib import Path
from typing import Dict, List

import numpy as np
import torch
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from torch.utils.data import DataLoader, Dataset as TorchDataset
from transformers import AutoModelForSequenceClassification, AutoTokenizer


def load_jsonl(path: Path) -> List[Dict[str, object]]:
    rows: List[Dict[str, object]] = []
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            rows.append(json.loads(line))
    return rows


class ScoreDataset(TorchDataset):
    def __init__(self, rows: List[Dict[str, object]], tokenizer, max_length: int):
        self.encodings = tokenizer(
            [str(row["job_description"]) for row in rows],
            [str(row["resume_text"]) for row in rows],
            truncation=True,
            padding="max_length",
            max_length=max_length,
        )
        self.scores = [float(row["fit_score"]) for row in rows]
        self.labels = [int(round(score)) for score in self.scores]

    def __len__(self) -> int:
        return len(self.labels)

    def __getitem__(self, idx: int):
        item = {
            key: torch.tensor(value[idx], dtype=torch.long)
            for key, value in self.encodings.items()
        }
        item["labels"] = torch.tensor(self.labels[idx], dtype=torch.long)
        item["scores"] = torch.tensor(self.scores[idx], dtype=torch.float32)
        return item


def logits_to_scores(logits: torch.Tensor) -> torch.Tensor:
    if logits.ndim == 1:
        return logits
    if logits.size(-1) == 1:
        return logits.squeeze(-1)
    classes = torch.arange(logits.size(-1), device=logits.device, dtype=torch.float32)
    probs = torch.softmax(logits, dim=-1)
    return torch.sum(probs * classes, dim=-1)


def evaluate_model(model, dataloader, device) -> Dict[str, float]:
    model.eval()
    losses: List[float] = []
    preds: List[float] = []
    labels: List[float] = []

    with torch.no_grad():
        for batch in dataloader:
            scores = batch.pop("scores").to(device)
            batch = {key: value.to(device) for key, value in batch.items()}
            outputs = model(**batch)
            losses.append(float(outputs.loss.item()))

            batch_preds = logits_to_scores(outputs.logits).detach().cpu().numpy().tolist()
            preds.extend([float(x) for x in batch_preds])
            labels.extend([float(x) for x in scores.detach().cpu().numpy().tolist()])

    clipped = np.clip(np.array(preds, dtype=np.float32), 0.0, 10.0)
    y_true = np.array(labels, dtype=np.float32)
    mse = mean_squared_error(y_true, clipped)
    return {
        "loss": float(np.mean(losses) if losses else 0.0),
        "mae": float(mean_absolute_error(y_true, clipped)),
        "rmse": float(np.sqrt(mse)),
        "r2": float(r2_score(y_true, clipped)),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Fine-tune transformer for resume-fit score prediction (0-10).")
    parser.add_argument("--train-file", type=Path, default=Path("ml_pipeline/data/train.jsonl"))
    parser.add_argument("--val-file", type=Path, default=Path("ml_pipeline/data/val.jsonl"))
    parser.add_argument("--output-dir", type=Path, default=Path("ml_pipeline/artifacts/score_model"))
    parser.add_argument("--base-model", type=str, default="prajjwal1/bert-tiny")
    parser.add_argument("--max-length", type=int, default=256)
    parser.add_argument("--epochs", type=int, default=2)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--learning-rate", type=float, default=2e-4)
    parser.add_argument("--weight-decay", type=float, default=0.01)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    torch.manual_seed(args.seed)
    np.random.seed(args.seed)
    args.output_dir.mkdir(parents=True, exist_ok=True)

    tokenizer = AutoTokenizer.from_pretrained(args.base_model)
    train_rows = load_jsonl(args.train_file)
    val_rows = load_jsonl(args.val_file)
    train_ds = ScoreDataset(train_rows, tokenizer, args.max_length)
    val_ds = ScoreDataset(val_rows, tokenizer, args.max_length)

    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False)

    model = AutoModelForSequenceClassification.from_pretrained(
        args.base_model,
        num_labels=11,
        id2label={idx: str(idx) for idx in range(11)},
        label2id={str(idx): idx for idx in range(11)},
    )
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=args.learning_rate,
        weight_decay=args.weight_decay,
    )

    best_mae = float("inf")
    best_state = None
    history: List[Dict[str, float]] = []

    for epoch in range(1, args.epochs + 1):
        model.train()
        epoch_losses: List[float] = []
        for batch in train_loader:
            batch.pop("scores")
            batch = {key: value.to(device) for key, value in batch.items()}
            optimizer.zero_grad()
            outputs = model(**batch)
            loss = outputs.loss
            loss.backward()
            optimizer.step()
            epoch_losses.append(float(loss.item()))

        val_metrics = evaluate_model(model, val_loader, device)
        train_loss = float(np.mean(epoch_losses) if epoch_losses else 0.0)
        row = {
            "epoch": float(epoch),
            "train_loss": train_loss,
            "val_loss": float(val_metrics["loss"]),
            "val_mae": float(val_metrics["mae"]),
        }
        history.append(row)
        print(json.dumps(row))

        if val_metrics["mae"] < best_mae:
            best_mae = float(val_metrics["mae"])
            best_state = {key: value.detach().cpu().clone() for key, value in model.state_dict().items()}

    if best_state is not None:
        model.load_state_dict(best_state)
        model.to(device)

    final_metrics = evaluate_model(model, val_loader, device)
    final_metrics["best_val_mae"] = float(best_mae)
    final_metrics["epochs"] = int(args.epochs)
    final_metrics["batch_size"] = int(args.batch_size)
    final_metrics["history"] = history

    model.save_pretrained(str(args.output_dir))
    tokenizer.save_pretrained(str(args.output_dir))
    (args.output_dir / "metrics.json").write_text(
        json.dumps(final_metrics, indent=2),
        encoding="utf-8",
    )
    print(json.dumps(final_metrics, indent=2))


if __name__ == "__main__":
    main()
