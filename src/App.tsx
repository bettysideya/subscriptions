import AuthGate from './components/AuthGate'
import SubscriptionsApp from './components/SubscriptionsApp'

function App() {
  return (
    <AuthGate>
      <SubscriptionsApp />
    </AuthGate>
  )
}

export default App
