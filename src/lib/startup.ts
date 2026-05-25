import { sendFrontendReadySignal } from "@/api/app/lifecycleApi";

let didNotifyFrontendReady = false;
let notifyInFlight: Promise<void> | null = null;

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

async function notifyFrontendReadyOnce(): Promise<void> {
  await sleep(0);
  await waitForFonts();
  await waitForPaint();
  await sendFrontendReadySignal();
}

export async function notifyFrontendReady(): Promise<void> {
  if (didNotifyFrontendReady) {
    return;
  }

  if (notifyInFlight) {
    return notifyInFlight;
  }

  notifyInFlight = notifyFrontendReadyOnce()
    .then(() => {
      didNotifyFrontendReady = true;
    })
    .catch(async (error) => {
      console.error("Failed to notify Tauri that frontend is ready:", error);
      await sleep(500);

      if (!didNotifyFrontendReady) {
        await sendFrontendReadySignal();
        didNotifyFrontendReady = true;
      }
    })
    .finally(() => {
      notifyInFlight = null;
    });

  return notifyInFlight;
}