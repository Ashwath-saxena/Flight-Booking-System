// frontend/src/workers/flightWorker.ts
// Minimal Web Worker for flight sorting (price, duration)
// No React imports here!
self.onmessage = function (event) {
  const { flights, sortBy } = event.data;
  const sorted = [...flights];
  if (sortBy === "price") {
    sorted.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  } else if (sortBy === "duration") {
    sorted.sort((a, b) => {
      // duration: string like "2h 45m"
      function toMinutes(str = "") {
        const match = str.match(/(\d+)h\s*(\d+)m/);
        if (!match) return 0;
        return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
      }
      return toMinutes(a.duration) - toMinutes(b.duration);
    });
  }
  // Post sorted data back
  postMessage(sorted);
};