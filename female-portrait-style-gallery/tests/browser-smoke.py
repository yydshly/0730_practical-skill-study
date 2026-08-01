import os
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / "docs" / "evidence"
URL = "http://127.0.0.1:43173/female-portrait-style-gallery/"
CHROME = Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")


def expect(condition, message):
    if not condition:
        raise AssertionError(message)


def exercise_mobile_journey(page):
    fantasy = page.locator('[data-category="fantasy"]')
    fantasy.focus()
    page.keyboard.press("Enter")
    expect(page.locator(".style-card").count() == 3, "390px 幻想分类应显示三个风格")
    expect(fantasy.get_attribute("aria-pressed") == "true", "390px 分类选中状态缺失")
    expect(
        page.evaluate("document.activeElement?.dataset.category === 'fantasy'"),
        "键盘激活分类后焦点应保留在所选分类按钮",
    )

    page.locator("#style-search").fill("幻想")
    expect(page.locator(".style-card").count() == 3, "390px 中文分类标签搜索应保留幻想分类结果")

    trigger = page.locator(".style-card__button").first
    trigger.click()
    page.locator('#style-dialog [data-sample-source="gemini"]').click()
    expect("assets/styles/gemini/04-gufeng-xianxia.png" in page.locator("#dialog-image").get_attribute("src"), "dialog Gemini sample should replace the image")
    page.locator('#style-dialog [data-sample-source="original"]').click()
    expect("assets/styles/04-gufeng-xianxia.png" in page.locator("#dialog-image").get_attribute("src"), "dialog should switch back to the original image")
    expect(page.locator("#style-dialog").evaluate("element => element.open"), "390px 详情弹窗未打开")
    page.locator("#copy-prompt").click()
    page.wait_for_timeout(180)
    expect("复制" in page.locator("#toast").inner_text(), "390px 复制操作缺少反馈")
    page.keyboard.press("Escape")
    expect(not page.locator("#style-dialog").evaluate("element => element.open"), "390px Esc 未关闭弹窗")
    expect(
        page.evaluate("document.activeElement?.classList.contains('style-card__button')"),
        "390px 关闭弹窗后焦点未返回卡片",
    )


def exercise_catalog_error(browser, app_source):
    page = browser.new_page(viewport={"width": 390, "height": 844})
    page_errors = []
    page.on("pageerror", lambda error: page_errors.append(str(error)))
    html = (ROOT / "index.html").read_text(encoding="utf-8").replace(
        '<script defer src="js/app.js"></script>',
        "",
    )
    invalid_app = app_source.replace(
        "id: 'urban-fashion'",
        "id: 'clean-lifestyle'",
        1,
    )
    expect(invalid_app != app_source, "目录错误场景未能构造重复 id")

    page.set_content(html, wait_until="load")
    page.add_script_tag(content=invalid_app)

    expect(page.locator("#empty-state").is_visible(), "非法目录应显示页面级错误")
    expect(page.locator("#empty-state h3").inner_text() == "风格目录加载失败", "目录错误标题不可读")
    expect("目录包含重复 id: clean-lifestyle" in page.locator("#empty-state").inner_text(), "目录错误应列出具体原因")
    expect(page.locator(".style-card").count() == 0, "非法目录不应尝试正常卡片渲染")
    expect(page.locator(".filter-button").count() == 0, "非法目录不应初始化筛选控件")
    expect(page.locator("#style-search").is_disabled(), "非法目录应停用搜索")
    expect(not page_errors, f"目录错误页脚本错误: {page_errors}")
    page.close()


def exercise_gallery(page, url, capture=False):
    page.set_viewport_size({"width": 1440, "height": 1000})
    page.goto(url, wait_until="networkidle")

    expect(page.locator(".style-card").count() == 20, f"{url} 应显示 20 张风格卡片")
    expect(page.locator(".style-card__prompt").count() == 20, "每张卡片应显示提示词摘要")
    expect(page.locator(".sample-switcher--card").count() == 20, "each card should expose a sample switcher")
    expect(page.locator('[data-sample-source="gemini"]').count() == 21, "20 cards plus one dialog Gemini control should exist")
    expect(page.locator("#global-sample-switcher").count() == 1, "one global sample switcher should be visible")
    expect(page.locator('[data-global-source="gemini"]').count() == 1, "global Gemini control should be visible")
    for prompt in page.locator(".style-card__prompt").all():
        clamp = prompt.evaluate(
            """element => {
                const style = getComputedStyle(element);
                return {
                    lineClamp: style.webkitLineClamp,
                    display: style.display,
                    webkitBoxOrient: style.webkitBoxOrient,
                    overflow: style.overflow,
                    lineHeight: Number.parseFloat(style.lineHeight),
                    clientHeight: element.clientHeight,
                };
            }"""
        )
        expect(
            clamp["lineClamp"] in ("3", "4"),
            "每张卡片提示词摘要应限制为 3 至 4 行",
        )
        expect(
            clamp["display"] in ("-webkit-box", "flow-root"),
            "提示词摘要应使用 WebKit 弹性盒截断",
        )
        expect(clamp["webkitBoxOrient"] == "vertical", "提示词摘要应垂直排列以支持行数截断")
        expect(clamp["overflow"] == "hidden", "提示词摘要的超出文本应隐藏")
        expect(clamp["lineHeight"] > 0, "提示词摘要应具有可计算的行高")
        expect(
            clamp["clientHeight"] <= clamp["lineHeight"] * int(clamp["lineClamp"]) + 1,
            "提示词摘要的实际高度不应超过截断行数",
        )
    expect(page.locator(".card-copy-button").count() == 20, "每张卡片应提供复制按钮")

    first_copy = page.locator(".card-copy-button").first
    first_copy.click()
    first_card = page.locator(".style-card").first
    first_card.locator('[data-sample-source="gemini"]').click()
    expect("assets/styles/gemini/01-clean-lifestyle.png" in first_card.locator("img").get_attribute("src"), "card Gemini sample should replace the image")
    expect(first_card.locator('[data-sample-source="gemini"]').get_attribute("aria-pressed") == "true", "card Gemini control should be pressed")
    first_card.locator('[data-sample-source="original"]').click()
    expect("assets/styles/01-clean-lifestyle.png" in first_card.locator("img").get_attribute("src"), "card should switch back to the original image")
    for card_index, gemini_path in [(9, "assets/styles/gemini/10-travel-vacation.png"), (17, "assets/styles/gemini/18-soft-ccd-energetic-voluptuous.png")]:
        sample_card = page.locator(".style-card").nth(card_index)
        sample_card.locator('[data-sample-source="gemini"]').click()
        expect(gemini_path in sample_card.locator("img").get_attribute("src"), "additional Gemini sample should load")
    page.locator('[data-global-source="gemini"]').click()
    expect(page.locator('[data-global-source="gemini"]').get_attribute("aria-pressed") == "true", "global Gemini control should be pressed")
    for image in page.locator(".style-card img").all():
        expect("assets/styles/gemini/" in image.get_attribute("src"), "global Gemini switch should update every card")
    page.locator("#style-search").fill("咖啡")
    expect(page.locator(".style-card").count() == 1, "global source should survive search filtering")
    expect("assets/styles/gemini/" in page.locator(".style-card img").first.get_attribute("src"), "filtered cards should keep the global Gemini source")
    page.locator("#style-search").fill("")
    page.locator('[data-global-source="original"]').click()
    expect(page.locator('[data-global-source="original"]').get_attribute("aria-pressed") == "true", "global original control should be pressed")
    for image in page.locator(".style-card img").all():
        expect("assets/styles/gemini/" not in image.get_attribute("src"), "global original switch should restore every card")
    expect(not page.locator("#style-dialog").evaluate("element => element.open"), "卡片复制不应打开详情")
    expect("复制" in page.locator("#toast").inner_text(), "卡片复制应显示反馈")

    expect(page.locator(".filter-button").count() == 10, "应显示全部与九个分类按钮")
    if capture:
        page.screenshot(path=EVIDENCE / "desktop-1440.png", full_page=True)

    page.locator("#style-search").fill("咖啡")
    expect(page.locator(".style-card").count() == 1, "搜索咖啡应只匹配一个风格")
    expect(page.locator("#result-count").inner_text() == "1 个风格", "搜索结果计数不正确")
    expect(page.locator(".style-card h3").inner_text() == "清纯生活照", "搜索命中风格不正确")

    page.locator("#style-search").fill("")
    page.locator('[data-category="fantasy"]').click()
    expect(page.locator(".style-card").count() == 3, "幻想分类应显示三个风格")
    expect(page.locator('[data-category="fantasy"]').get_attribute("aria-pressed") == "true", "分类选中状态缺失")

    trigger = page.locator(".style-card__button").first
    trigger.click()
    page.locator('#style-dialog [data-sample-source="gemini"]').click()
    expect("assets/styles/gemini/04-gufeng-xianxia.png" in page.locator("#dialog-image").get_attribute("src"), "dialog Gemini sample should replace the image")
    page.locator('#style-dialog [data-sample-source="original"]').click()
    expect("assets/styles/04-gufeng-xianxia.png" in page.locator("#dialog-image").get_attribute("src"), "dialog should switch back to the original image")
    expect(page.locator("#style-dialog").evaluate("element => element.open"), "详情弹窗未打开")
    expect(page.locator("#dialog-title").inner_text() == "古风仙侠美人图", "详情内容与卡片不一致")
    expect("云海" in page.locator("#dialog-prompt").inner_text(), "详情提示词不完整")
    if capture:
        page.screenshot(path=EVIDENCE / "detail-dialog-1440.png")
    page.locator("#copy-prompt").click()
    page.wait_for_timeout(180)
    expect("复制" in page.locator("#toast").inner_text(), "复制操作缺少反馈")
    page.keyboard.press("Escape")
    expect(not page.locator("#style-dialog").evaluate("element => element.open"), "Esc 未关闭弹窗")
    expect(page.evaluate("document.activeElement?.classList.contains('style-card__button')"), "关闭弹窗后焦点未返回卡片")

    page.locator("#style-search").fill("不存在的风格词")
    expect(page.locator("#empty-state").is_visible(), "空结果状态未显示")
    page.locator("#reset-filters").click()
    page.locator(".style-card img").first.evaluate("img => { img.src = 'missing-browser-smoke.png'; }")
    page.wait_for_timeout(120)
    expect(page.locator(".style-card").count() == 20, "重置后未恢复全部风格")
    expect(page.locator("#style-search").evaluate("element => element === document.activeElement"), "重置后搜索框未获得焦点")
    expect(page.locator(".image-fallback:visible").count() >= 1, "缺图时未显示可读占位")

    for width, height, filename in [
        (768, 960, "tablet-768.png"),
        (390, 844, "mobile-390.png"),
    ]:
        page.set_viewport_size({"width": width, "height": height})
        page.goto(url, wait_until="networkidle")
        if capture:
            page.screenshot(path=EVIDENCE / filename, full_page=True)
        expect(page.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), f"{width}px 出现横向页面溢出")
        if width == 390:
            exercise_mobile_journey(page)


def main():
    EVIDENCE.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            executable_path=str(CHROME),
            headless=True,
        )

        page = browser.new_page(viewport={"width": 1440, "height": 1000})
        page_errors = []
        page.on("pageerror", lambda error: page_errors.append(str(error)))

        capture = os.environ.get("CAPTURE_EVIDENCE") == "1"
        exercise_gallery(page, URL, capture=capture)
        exercise_gallery(page, (ROOT / "index.html").as_uri())
        exercise_catalog_error(browser, (ROOT / "js" / "app.js").read_text(encoding="utf-8"))

        expect(not page_errors, f"页面脚本错误: {page_errors}")
        browser.close()

    print("Browser smoke checks passed: desktop 1440, tablet 768, mobile 390")


if __name__ == "__main__":
    main()
