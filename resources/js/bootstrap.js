import axios from "axios"
window.axios = axios
window.axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest"

const reverbKey = import.meta.env.VITE_REVERB_APP_KEY

if (reverbKey) {
  Promise.all([
    import("laravel-echo"),
    import("pusher-js"),
  ])
    .then(([{ default: Echo }, { default: Pusher }]) => {
      window.Pusher = Pusher

      window.Echo = new Echo({
        broadcaster: "reverb",
        key: reverbKey,
        wsHost: import.meta.env.VITE_REVERB_HOST ?? window.location.hostname,
        wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
        wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? "http") === "https",
        enabledTransports: ["ws", "wss"],
        authEndpoint: "/broadcasting/auth",
        withCredentials: true,
      })
    })
    .catch((error) => {
      console.warn("Echo bootstrap skipped:", error)
    })
}
