from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / "docs" / "evidence"
URL = "http://127.0.0.1:43173/"
CHROME = Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")


def expect(condition, message):
    if not condition:
        raise AssertionError(message)


def exercise_gallery(page, url, capture=False):
    page.set_viewport_size({"width": 1440, "height": 1000})
    page.goto(url, wait_until="networkidle")

    expect(page.locator(".style-card").count() == 20, f"{url} 应显示 20 张风格卡片")
    expect(page.locator(".style-card__prompt").count() == 20, "每张卡片应显示提示词摘要")
    expect(page.locator(".card-copy-button").count() == 20, "每张卡片应提供复制按钮")

    first_copy = page.locator(".card-copy-button").first
    first_copy.click()
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
    expect(page.locator("#style-dialog").evaluate("element => element.open"), "详情弹窗未打开")
    expect(page.locator("#dialog-title").inner_text() == "古风仙侠美人图", "详情内容与卡片不一致")
    expect("云海" in page.locator("#dialog-prompt").inner_text(), "详情提示词不完整")
    if capture:
        page.screenshot(path=EVIDENCE / "detail-dialog-1440.png")
    page.locator("#copy-prompt").click()
    expect("复制" in page.locator("#toast").inner_text(), "复制操作缺少反馈")
    page.keyboard.press("Escape")
    expect(not page.locator("#style-dialog").evaluate("element => element.open"), "Esc 未关闭弹窗")
    expect(page.evaluate("document.activeElement?.classList.contains('style-card__button')"), "关闭弹窗后焦点未返回卡片")

    page.locator("#style-search").fill("不存在的风格词")
    expect(page.locator("#empty-state").is_visible(), "空结果状态未显示")
    page.locator("#reset-filters").click()
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

        exercise_gallery(page, "http://127.0.0.1:43173/", capture=True)
        exercise_gallery(page, (ROOT / "index.html").as_uri())

        expect(not page_errors, f"页面脚本错误: {page_errors}")
        browser.close()

    print("Browser smoke checks passed: desktop 1440, tablet 768, mobile 390")


if __name__ == "__main__":
    main()
