import { sendFrontendReadySignal } from "@/api/app/lifecycleApi";

let didNotifyFrontendReady = false;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function waitForPaint(): Promise<void> {
  return Promise.race([
    new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => resolve());
      });
    }),
    sleep(300),
  ]);
}

async function waitForFonts(): Promise<void> {
  if (!("fonts" in document)) {
    return;
  }

  await Promise.race([document.fonts.ready.then(() => undefined), sleep(500)]);
}

export async function notifyFrontendReady(): Promise<void> {
  if (didNotifyFrontendReady) {
    return;
  }

  didNotifyFrontendReady = true;

  try {
    await sleep(0);
    await waitForFonts();
    await waitForPaint();
    await sendFrontendReadySignal();
  } catch (error) {
    console.error("Failed to notify Tauri that frontend is ready:", error);
  }
}