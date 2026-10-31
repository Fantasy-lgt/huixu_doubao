#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""UI 交付自测器 (selfcheck) — 妙搭网页产物交付前静态体检，纯 Python 标准库。

对一个 HTML 文件或一个交付目录做静态检查，把"问题列表"里可静态判定的
硬标准落成检查项，输出结构化 JSON + 人读摘要，并以退出码表达是否放行。

用法:
  python3 selfcheck.py <path-to-html-or-dir> [--strict] [--json=out.json]

退出码: 0=无 FAIL; 1=存在 FAIL(或 --strict 下存在 WARN); 2=用法错误。

它只做**静态**体检 (死链/外链/px-pt/viewport/汉堡菜单/占位符/design.md 等)。
交互行为 (事件处理、375px 适配、轮播切换) 仍需核对实现位置，
本工具会明确标注"需实现核对"的项，不用它替代完整实现审查。
"""
import sys
import os
import re
import json
from html.parser import HTMLParser

SEV = {"FAIL": 3, "WARN": 2, "INFO": 1}


class Finding:
    __slots__ = ("check", "sev", "msg", "where")

    def __init__(self, check, sev, msg, where=""):
        self.check = check
        self.sev = sev
        self.msg = msg
        self.where = where

    def as_dict(self):
        return {"check": self.check, "severity": self.sev, "message": self.msg, "where": self.where}


class Collector(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.has_viewport = False
        self.html_lang = None
        self.nav_count = 0
        self.anchors = []
        self.buttons = []
        self.imgs = []
        self.forms = 0
        self.submit_controls = 0
        self.required_inputs = 0
        self.inline_styles = []
        self.ext_resources = []   # (tag, url)
        self.menu_toggle = False
        self.aria_invalid = False
        self.error_classes = False
        self.style_blocks = []
        self._in_style = False
        self.media_query = False

    def handle_starttag(self, tag, attrs):
        a = {k.lower(): (v or "") for k, v in attrs}
        if tag == "meta" and a.get("name", "").lower() == "viewport":
            self.has_viewport = True
        if tag == "html":
            self.html_lang = a.get("lang")
        if tag == "nav":
            self.nav_count += 1
        if tag == "a":
            self.anchors.append(a)
        if tag == "button" or (a.get("role", "") == "button"):
            self.buttons.append((tag, a))
        if tag == "img":
            self.imgs.append(a)
        if tag == "form":
            self.forms += 1
        if tag in ("input", "button") and a.get("type", "").lower() == "submit":
            self.submit_controls += 1
        if tag in ("input", "select", "textarea") and ("required" in a):
            self.required_inputs += 1
        if "aria-invalid" in a:
            self.aria_invalid = True
        cls = a.get("class", "").lower()
        idv = a.get("id", "").lower()
        al = a.get("aria-label", "").lower()
        blob = " ".join([cls, idv, al])
        if any(k in blob for k in ("hamburger", "menu-toggle", "menu-btn", "nav-toggle", "navbar-toggle", "drawer")):
            self.menu_toggle = True
        if any(k in cls for k in ("error", "invalid", "hint", "help-text", "field-error")):
            self.error_classes = True
        if "style" in a:
            self.inline_styles.append(a["style"])
        for k in ("src", "href"):
            if k in a:
                url = a[k].strip()
                if tag in ("img", "script", "link", "source", "audio", "video", "iframe"):
                    if re.match(r"^(https?:)?//", url):
                        self.ext_resources.append((tag, url))
        if tag == "style":
            self._in_style = True

    def handle_endtag(self, tag):
        if tag == "style":
            self._in_style = False

    def handle_data(self, data):
        if self._in_style:
            self.style_blocks.append(data)
            if "@media" in data:
                self.media_query = True


PLACEHOLDER_RE = re.compile(r"(待补充|待完善|待定|TODO|FIXME|占位|lorem ipsum|placeholder|undefined|NaN|xxxx|\bTBD\b)", re.I)
PX_RE = re.compile(r"\b\d+(?:\.\d+)?px\b")
PT_RE = re.compile(r"\b\d+(?:\.\d+)?pt\b")


def check_html(path, text, findings):
    c = Collector()
    try:
        c.feed(text)
    except Exception as e:
        findings.append(Finding("PARSE", "WARN", "HTML 解析异常: %s" % e, path))
        return c

    # item 1: 死链 / 死按钮
    for a in c.anchors:
        href = a.get("href", "").strip()
        has_handler = ("onclick" in a) or a.get("role") == "button" or ("data-action" in a)
        if href in ("", "#", "javascript:void(0)", "javascript:;") and not has_handler:
            findings.append(Finding("DL-01", "FAIL", "空/占位锚点(死链): href=%r" % (href or "缺失"), path))
    for tag, b in c.buttons:
        typ = b.get("type", "").lower()
        has_handler = ("onclick" in b) or typ in ("submit", "reset") or ("data-action" in b) or ("form" in b)
        if not has_handler:
            findings.append(Finding("DL-02", "WARN", "按钮无可见处理器(疑似死按钮, 需实现核对): <%s>" % tag, path))

    # item 3 / 6: viewport
    if not c.has_viewport:
        findings.append(Finding("RESP-01", "FAIL", "缺少 <meta name=viewport>，移动端适配与 375px 声明无法成立", path))
    if not c.media_query and c.nav_count:
        findings.append(Finding("RESP-02", "WARN", "未发现 @media 断点，响应式仅靠布局自适应，需核对 375/768/1024 适配规则", path))

    # item 1: 移动端汉堡菜单
    if c.nav_count and not c.menu_toggle:
        findings.append(Finding("NAV-01", "WARN", "存在 <nav> 但未发现汉堡/菜单切换控件，移动端导航可能不可用(需实现核对)", path))

    # item 1: 表单反馈
    if c.required_inputs and not (c.aria_invalid or c.error_classes):
        findings.append(Finding("FORM-01", "WARN", "存在 required 输入(%d) 但未发现校验反馈元素(aria-invalid/.error)，需补必填与提交反馈" % c.required_inputs, path))
    if c.forms and c.submit_controls == 0:
        findings.append(Finding("FORM-02", "WARN", "存在 <form> 但无提交控件", path))

    # item 5: 离线可用
    for tag, url in c.ext_resources:
        sev = "FAIL" if tag in ("img", "script", "link", "audio", "video", "source") else "WARN"
        findings.append(Finding("OFF-01", sev, "外部绝对资源(离线不可用/裂图风险) <%s>: %s" % (tag, url[:80]), path))
    for style in c.style_blocks:
        for m in re.finditer(r"url\(\s*['\"]?((?:https?:)?//[^)'\"]+)", style):
            findings.append(Finding("OFF-02", "WARN", "CSS 外链资源(离线风险): %s" % m.group(1)[:80], path))

    # item 6: 无障碍
    if not c.html_lang:
        findings.append(Finding("A11Y-01", "WARN", "<html> 缺少 lang 属性", path))
    for im in c.imgs:
        if "alt" not in im:
            findings.append(Finding("A11Y-02", "WARN", "<img> 缺少 alt: %s" % im.get("src", "")[:60], path))
    all_css = " ".join(c.inline_styles) + " ".join(c.style_blocks)
    if PX_RE.search(all_css) and PT_RE.search(all_css):
        findings.append(Finding("A11Y-03", "WARN", "同一产物混用 px 与 pt 单位，屏幕端应统一为 px/rem", path))

    # item 8 / 渐进式: 占位符
    body = re.sub(r"<(script|style)[\s\S]*?</\1>", " ", text, flags=re.I)
    body = re.sub(r"<[^>]+>", " ", body)
    hits = sorted(set(m.group(0) for m in PLACEHOLDER_RE.finditer(body)))
    if hits:
        findings.append(Finding("PROG-01", "INFO", "检测到占位/未完成标记 %s —— 未完成项必须显式标注\"待补充\"，禁止声明已完成" % hits, path))
    return c


DESIGN_NAMES = ("design.md", "design-spec.md", "design_spec.md", "设计规范.md", "设计说明.md")
SPEC_SECTIONS = {
    "色值": r"(色值|颜色|color|token|#[0-9a-fA-F]{3,6})",
    "字体": r"(字体|font|字号|type\s*scale|typograph)",
    "间距": r"(间距|spacing|栅格|grid|8\s*px|8pt)",
    "断点": r"(断点|breakpoint|响应式|375|768|1024|media)",
}


def read_text(path):
    for enc in ("utf-8", "gb18030", "latin-1"):
        try:
            with open(path, "r", encoding=enc) as f:
                return f.read()
        except (UnicodeDecodeError, OSError):
            continue
    return ""


def check_delivery_dir(root, findings):
    files = []
    for dp, _, fns in os.walk(root):
        for fn in fns:
            files.append(os.path.join(dp, fn))
    lower = [f.lower() for f in files]

    design = None
    for f in files:
        if os.path.basename(f).lower() in DESIGN_NAMES:
            design = f
            break
    if not design:
        findings.append(Finding("SPEC-01", "FAIL", "交付目录缺少 design.md(设计规范文档)，不能只给预览链接/静态图", root))
    else:
        txt = read_text(design)
        for name, pat in SPEC_SECTIONS.items():
            if not re.search(pat, txt, re.I):
                findings.append(Finding("SPEC-02", "WARN", "design.md 缺少「%s」相关参数(色值/字体/间距/断点需齐全)" % name, design))

    has_img_files = any(l.endswith((".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif")) for l in lower)
    html_files = [f for f in files if f.lower().endswith((".html", ".htm"))]
    if html_files and not has_img_files:
        for hf in html_files:
            if "<img" in read_text(hf).lower():
                findings.append(Finding("OFF-03", "WARN", "交付目录未见任何本地图片文件，zip 导出可能裂图(图片需本地化随包)", root))
                break
    return html_files


def main(argv):
    args = [a for a in argv if not a.startswith("--")]
    flags = [a for a in argv if a.startswith("--")]
    strict = "--strict" in flags
    json_out = None
    for f in flags:
        if f.startswith("--json"):
            parts = f.split("=", 1)
            json_out = parts[1] if len(parts) == 2 else "selfcheck.json"
    if not args:
        print(__doc__)
        return 2
    target = args[0]
    if not os.path.exists(target):
        print("路径不存在: %s" % target, file=sys.stderr)
        return 2

    findings = []
    if os.path.isdir(target):
        html_files = check_delivery_dir(target, findings)
    else:
        html_files = [target]

    for hf in html_files:
        check_html(hf, read_text(hf), findings)

    findings.sort(key=lambda f: -SEV.get(f.sev, 0))
    fails = [f for f in findings if f.sev == "FAIL"]
    warns = [f for f in findings if f.sev == "WARN"]
    infos = [f for f in findings if f.sev == "INFO"]

    print("=" * 64)
    print("UI 交付自测报告  —  目标: %s" % target)
    print("  扫描 HTML 文件: %d" % len(html_files))
    print("  FAIL(阻断) %d | WARN(需核对/整改) %d | INFO %d" % (len(fails), len(warns), len(infos)))
    print("=" * 64)
    for f in findings:
        icon = {"FAIL": "x", "WARN": "!", "INFO": "."}[f.sev]
        print("  [%s] %-8s %s" % (icon, f.check, f.msg))
        if f.where:
            print("           -> %s" % f.where)
    print("-" * 64)
    print("提示: 死按钮/轮播内容变化/375px 适配/表单提交反馈 等标 '需实现核对' 的项,")
    print("      必须记录对应结构、处理器和状态定义，才能在交付说明中声明为'已完成'。")

    result = {
        "target": target,
        "html_files": html_files,
        "summary": {"fail": len(fails), "warn": len(warns), "info": len(infos)},
        "findings": [f.as_dict() for f in findings],
    }
    if json_out:
        with open(json_out, "w", encoding="utf-8") as jf:
            json.dump(result, jf, ensure_ascii=False, indent=2)
        print("已写出 JSON: %s" % os.path.abspath(json_out))

    if fails:
        return 1
    if strict and warns:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
