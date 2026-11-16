export function navigateWithLoading<T>(navigate: () => T): T {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("party-play:navigation-start"));
  }
  return navigate();
}
