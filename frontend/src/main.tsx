import React from 'react'
import {createRoot} from 'react-dom/client'
import './style.css'
import App from './App'
import { useSettingsStore } from './store/settingsStore'

const container = document.getElementById('root')

const root = createRoot(container!)

void useSettingsStore.getState().loadSettings().then(() => {
  const { theme } = useSettingsStore.getState().settings
  document.documentElement.classList.toggle('dark', theme === 'dark')
})

root.render(
    <React.StrictMode>
        <App/>
    </React.StrictMode>
)
