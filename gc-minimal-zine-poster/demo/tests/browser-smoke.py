import os
import re
import sys
import time
from urllib.parse import urlparse


DEMO_BASE_URL = os.environ.get(
    "DEMO_BASE_URL",
    "http://127.0.0.1:43173/gc-minimal-zine-poster/demo/",
)


def need_context(message: str) -> int:
    print(f"NEEDS_CONTEXT: {message}")
    return 2


def split_paragraphs(text: str) -> list[str]:
    normalized = text.replace("\r\n", "\n").strip()
    if not normalized:
        return []
    return [part.strip() for part in re.split(r"\n\s*\n", normalized) if part.strip()]


def assert_local_poster_src(src: str) -> None:
    assert src, "Expected #poster-image to have a src"
    if src.startswith("assets/generated/"):
        assert src.endswith(".jpeg"), f"Expected JPEG poster asset, got: {src}"
        return
    parsed = urlparse(src)
    assert parsed.scheme in {"http", "https"}, f"Expected resolved local URL, got: {src}"
    assert parsed.hostname in {"127.0.0.1", "localhost"}, f"Expected local asset URL, got: {src}"
    assert "/gc-minimal-zine-poster/demo/assets/generated/" in parsed.path, (
        f"Expected generated local asset path, got: {src}"
    )
    assert parsed.path.endswith(".jpeg"), f"Expected JPEG poster asset, got: {src}"


def wait_until(predicate, message: str, timeout_seconds: float = 5.0) -> None:
    deadline = time.monotonic() + timeout_seconds
    last_value = None
    while time.monotonic() < deadline:
        last_value = predicate()
        if last_value:
            return
        time.sleep(0.1)
    raise AssertionError(f"{message}. Last observed value: {last_value!r}")


def main() -> int:
    try:
        from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
        from playwright.sync_api import sync_playwright
    except ModuleNotFoundError:
        return need_context("Python Playwright is unavailable in this environment.")

    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch()
            page = browser.new_page(viewport={"width": 1440, "height": 1200})
            page.goto(DEMO_BASE_URL, wait_until="domcontentloaded")

            print("step: load route")
            brief_input = page.locator("#brief-input")
            brief_input.wait_for(state="visible", timeout=5000)

            print("step: initial poster")
            poster_image = page.locator("#poster-image")
            poster_image.wait_for(state="visible", timeout=5000)
            assert_local_poster_src(poster_image.get_attribute("src") or "")

            print("step: initial prompt")
            prompt_output = page.locator("#prompt-output")
            prompt_output.wait_for(state="visible", timeout=5000)
            starting_prompt = prompt_output.inner_text().strip()
            assert len(split_paragraphs(starting_prompt)) == 4, (
                "Expected #prompt-output to contain exactly four paragraphs."
            )

            recipe_ids = page.locator("[data-recipe-id]")
            assert recipe_ids.count() >= 1, "Expected at least one [data-recipe-id] node."

            status = page.locator("#workflow-status")
            preset_button = page.locator("#preset-list [data-preset-value]").first
            print("step: preset compile")
            preset_button.click()
            selected_preset_value = preset_button.get_attribute("data-preset-value") or ""

            compile_button = page.locator("#compile-button")
            variation_button = page.locator("#variation-button")
            compile_button.click()
            assert compile_button.is_disabled(), "Expected Compile Prompt to be disabled while compiling."
            assert variation_button.is_disabled(), "Expected New Variation to be disabled while compiling."
            wait_until(
                lambda: prompt_output.inner_text().strip() != starting_prompt,
                "Expected prompt to change after compiling a preset",
            )
            wait_until(
                lambda: bool(re.search(r"\bREADY\b", status.inner_text(), re.IGNORECASE)),
                "Expected workflow status to reach READY",
            )
            assert not compile_button.is_disabled(), "Expected Compile Prompt to re-enable after compiling."
            assert not variation_button.is_disabled(), "Expected New Variation to re-enable after compiling."

            updated_prompt = prompt_output.inner_text().strip()
            assert updated_prompt != starting_prompt, "Expected prompt to change after compiling a preset."

            print("step: hostile input literal rendering")
            hostile_input = '<img src=x onerror="window.__zineXss = true">'
            page.evaluate("() => { window.__zineXss = false; }")
            brief_input.fill(hostile_input)
            compile_button.click()
            wait_until(
                lambda: bool(re.search(r"\bREADY\b", status.inner_text(), re.IGNORECASE)),
                "Expected workflow status to reach READY after compiling hostile input",
            )
            field_output = page.locator("#field-output")
            field_output_text = field_output.inner_text()
            assert hostile_input in field_output_text, (
                "Expected hostile input to render as literal text inside #field-output."
            )
            assert prompt_output.inner_text().count(hostile_input) >= 1, (
                "Expected #prompt-output to keep the hostile input as normal rendered text."
            )
            assert field_output.locator("img").count() == 0, (
                "Expected hostile input not to create an injected <img> element."
            )
            assert page.evaluate("() => window.__zineXss") is False, (
                "Expected hostile input not to execute injected event handlers."
            )

            print("step: empty input validation")
            brief_input.fill("")
            compile_button.click()
            wait_until(
                lambda: bool(re.search(r"请输入|请输入一个主题|empty|required", status.inner_text(), re.IGNORECASE)),
                "Expected a readable empty-input error",
            )

            assert brief_input.evaluate("node => document.activeElement === node"), (
                "Expected focus to return to #brief-input after empty-input validation."
            )

            print("step: restore preset")
            preset_to_restore = page.locator(
                f"#preset-list [data-preset-value=\"{selected_preset_value}\"]"
            )
            preset_to_restore.click()
            compile_button.click()
            wait_until(
                lambda: bool(re.search(r"\bREADY\b", status.inner_text(), re.IGNORECASE)),
                "Expected workflow status to return to READY",
            )

            recipe_before = recipe_ids.first.inner_text().strip()
            print("step: variation")
            variation_button.click()
            wait_until(
                lambda: recipe_ids.first.inner_text().strip() != recipe_before,
                "Expected Variation to switch recipe id",
            )
            recipe_after = recipe_ids.first.inner_text().strip()
            assert recipe_after != recipe_before, "Expected Variation to switch recipe id."

            copy_button = page.locator("#copy-prompt")
            print("step: copy prompt")
            copy_button.click()
            toast = page.locator("#toast")
            wait_until(
                lambda: bool(re.search(r"copied|已复制|复制成功", toast.inner_text(), re.IGNORECASE)),
                "Expected copy-success toast feedback",
            )

            print("step: copy failure")
            prompt_before_copy_failure = prompt_output.inner_text()
            page.evaluate(
                """
                () => {
                    Object.defineProperty(navigator, 'clipboard', {
                        configurable: true,
                        value: {
                            writeText: () => Promise.reject(new Error('forced clipboard failure')),
                        },
                    });
                    document.execCommand = () => false;
                }
                """
            )
            copy_button.click()
            wait_until(
                lambda: bool(re.search(r"copy failed|could not copy|unable to copy|failed|失败|失敗", toast.inner_text(), re.IGNORECASE)),
                "Expected copy-failure toast feedback",
            )
            assert prompt_output.inner_text() == prompt_before_copy_failure, (
                "Expected failed copy attempt to preserve selectable prompt text."
            )

            open_dialog_button = page.locator("[data-open-dialog]").first
            print("step: dialog escape")
            open_dialog_button.click()
            dialog = page.locator("#asset-dialog")
            dialog.wait_for(state="visible", timeout=5000)
            page.keyboard.press("Escape")
            wait_until(
                lambda: page.locator("#asset-dialog").evaluate("node => !node.hasAttribute('open')"),
                "Expected dialog to close on Escape",
            )
            assert open_dialog_button.evaluate("node => document.activeElement === node"), (
                "Expected focus to return to the dialog opener after Escape."
            )
            browser.close()
            return 0
    except PlaywrightTimeoutError as exc:
        print(f"Browser smoke failed: {exc}")
        return 1
    except Exception as exc:  # noqa: BLE001
        print(f"Browser smoke failed: {exc}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
