import argparse
import json
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
import torch
from seqeval.metrics import accuracy_score, f1_score, precision_score, recall_score
from torch.utils.data import DataLoader, Dataset as TorchDataset
from transformers import AutoModelForTokenClassification, AutoTokenizer


LABELS = ["O", "B-SKILL", "I-SKILL"]
LABEL2ID = {label: idx for idx, label in enumerate(LABELS)}
ID2LABEL = {idx: label for label, idx in LABEL2ID.items()}


def load_jsonl(path: Path) -> List[Dict[str, object]]:
    rows: List[Dict[str, object]] = []
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            rows.append(json.loads(line))
    return rows


def assign_label(offset: Tuple[int, int], spans: List[Dict[str, object]]) -> int:
    start, end = offset
    if start == end:
        return -100

    for span in spans:
        span_start = int(span["start"])
        span_end = int(span["end"])
        if end <= span_start or start >= span_end:
            continue
        if start <= span_start < end:
            return LABEL2ID["B-SKILL"]
        return LABEL2ID["I-SKILL"]
    return LABEL2ID["O"]


class SkillDataset(TorchDataset):
    def __init__(self, rows: List[Dict[str, object]], tokenizer, max_length: int):
        self.features: List[Dict[str, List[int]]] = []
        for row in rows:
            tokenized = tokenizer(
                str(row["resume_text"]),
                truncation=True,
                padding="max_length",
                max_length=max_length,
                return_offsets_mapping=True,
            )
            spans = row.get("skill_spans", [])
            labels = [assign_label((int(s), int(e)), spans) for s, e in tokenized["offset_mapping"]]
            tokenized.pop("offset_mapping")
            tokenized["labels"] = labels
            self.features.append(tokenized)

    def __len__(self) -> int:
        return len(self.features)

    def __getitem__(self, idx: int):
        return {
            key: torch.tensor(value, dtype=torch.long)
            for key, value in self.features[idx].items()
        }


def evaluate_model(model, dataloader, device) -> Dict[str, float]:
    model.eval()
    losses: List[float] = []
    pred_tags: List[List[str]] = []
    true_tags: List[List[str]] = []

    with torch.no_grad():
        for batch in dataloader:
            batch = {key: value.to(device) for key, value in batch.items()}
            outputs = model(**batch)
            losses.append(float(outputs.loss.item()))

            preds = torch.argmax(outputs.logits, dim=-1).detach().cpu().numpy()
            labels = batch["labels"].detach().cpu().numpy()
            for pred_row, label_row in zip(preds, labels):
                p_row: List[str] = []
                t_row: List[str] = []
                for pred_id, label_id in zip(pred_row, label_row):
                    if int(label_id) == -100:
                        continue
                    p_row.append(ID2LABEL[int(pred_id)])
                    t_row.append(ID2LABEL[int(label_id)])
                pred_tags.append(p_row)
                true_tags.append(t_row)

    precision = float(precision_score(true_tags, pred_tags, zero_division=0)) if pred_tags else 0.0
    recall = float(recall_score(true_tags, pred_tags, zero_division=0)) if pred_tags else 0.0
    f1 = float(f1_score(true_tags, pred_tags, zero_division=0)) if pred_tags else 0.0
    accuracy = float(accuracy_score(true_tags, pred_tags)) if pred_tags else 0.0
    return {
        "loss": float(np.mean(losses) if losses else 0.0),
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "accuracy": accuracy,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Fine-tune transformer for skill extraction.")
    parser.add_argument("--train-file", type=Path, default=Path("ml_pipeline/data/train.jsonl"))
    parser.add_argument("--val-file", type=Path, default=Path("ml_pipeline/data/val.jsonl"))
    parser.add_argument("--output-dir", type=Path, default=Path("ml_pipeline/artifacts/skill_model"))
    parser.add_argument("--base-model", type=str, default="prajjwal1/bert-tiny")
    parser.add_argument("--max-length", type=int, default=256)
    parser.add_argument("--epochs", type=int, default=2)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--learning-rate", type=float, default=3e-5)
    parser.add_argument("--weight-decay", type=float, default=0.01)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    torch.manual_seed(args.seed)
    np.random.seed(args.seed)
    args.output_dir.mkdir(parents=True, exist_ok=True)

    tokenizer = AutoTokenizer.from_pretrained(args.base_model, use_fast=True)
    train_rows = load_jsonl(args.train_file)
    val_rows = load_jsonl(args.val_file)
    train_ds = SkillDataset(train_rows, tokenizer, args.max_length)
    val_ds = SkillDataset(val_rows, tokenizer, args.max_length)

    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False)

    model = AutoModelForTokenClassification.from_pretrained(
        args.base_model,
        num_labels=len(LABELS),
        id2label=ID2LABEL,
        label2id=LABEL2ID,
    )
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=args.learning_rate,
        weight_decay=args.weight_decay,
    )

    best_f1 = -1.0
    best_state = None
    history: List[Dict[str, float]] = []

    for epoch in range(1, args.epochs + 1):
        model.train()
        epoch_losses: List[float] = []
        for batch in train_loader:
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
            "val_f1": float(val_metrics["f1"]),
        }
        history.append(row)
        print(json.dumps(row))

        if val_metrics["f1"] > best_f1:
            best_f1 = float(val_metrics["f1"])
            best_state = {key: value.detach().cpu().clone() for key, value in model.state_dict().items()}

    if best_state is not None:
        model.load_state_dict(best_state)
        model.to(device)

    final_metrics = evaluate_model(model, val_loader, device)
    final_metrics["best_val_f1"] = float(best_f1)
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
