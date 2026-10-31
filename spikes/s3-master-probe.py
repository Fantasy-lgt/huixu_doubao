# -*- coding: utf-8 -*-
# Spike-S3：真实母版填充可行性探针（只评估、不进主线；仅使用脱敏模板）
# 运行：pip install python-pptx
#       python spikes/s3-master-probe.py path/to/template.pptx
# 目的：枚举 slide_layouts / placeholders，试填 1 个文本占位符另存，人工核对母版配色/图形是否保留。
# 不做：版式视觉识别、任意页型自动匹配、承诺“无损”。
import sys
import json
from pptx import Presentation


def probe(path):
    prs = Presentation(path)
    report = {"file": path, "layouts": []}
    for layout in prs.slide_layouts:
        phs = []
        for ph in layout.placeholders:
            phs.append({
                "idx": ph.placeholder_format.idx,
                "type": str(ph.placeholder_format.type),
                "name": ph.name,
                "has_text_frame": ph.has_text_frame,
            })
        report["layouts"].append({"layout": layout.name, "placeholders": phs})

    target = None
    for layout in prs.slide_layouts:
        for ph in layout.placeholders:
            if ph.has_text_frame:
                target = ph
                break
        if target:
            break

    report["fill_target"] = target.name if target else None
    if target:
        target.text_frame.text = "SPIKE 测试文字（探针用，非成品）"
        out = path.replace(".pptx", "-filled.pptx")
        prs.save(out)
        report["filled_out"] = out
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("usage: python s3-master-probe.py <template.pptx>")
        sys.exit(0)
    probe(sys.argv[1])
