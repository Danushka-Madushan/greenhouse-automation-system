import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Toast } from '@heroui/react/toast'
import { Fragment } from 'react/jsx-runtime'

createRoot(document.getElementById('root')!).render(
  <Fragment>
    <Toast.Provider />
    <App />
  </Fragment>
)
