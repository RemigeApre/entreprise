export default defineNuxtPlugin(() => {
  const colorMode = useColorMode()
  colorMode.preference = 'light'
  colorMode.value = 'light'

  // MutationObserver : si quoi que ce soit remet .dark, on le retire immédiatement
  const el = document.documentElement
  el.classList.remove('dark')
  el.classList.add('light')
  el.style.colorScheme = 'light'

  const observer = new MutationObserver(() => {
    if (el.classList.contains('dark')) {
      el.classList.remove('dark')
      el.classList.add('light')
    }
  })
  observer.observe(el, { attributes: true, attributeFilter: ['class'] })
})
