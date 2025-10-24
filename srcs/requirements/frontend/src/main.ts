import './styles/index.css'
import { App } from './App'

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new App()
  app.mount('#app')
})
