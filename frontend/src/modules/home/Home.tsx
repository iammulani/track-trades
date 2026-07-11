import { Card } from '../../shared/components/Card'
import { PageHeader } from '../../shared/components/PageHeader'
import './Home.css'

export function Home() {
  return (
    <section className="home">
      <PageHeader
        icon="about"
        title="About Track Trades"
        subtitle="Local-first — the UI, the database, and the API all run on your machine."
      />

      <Card className="home__card">
        <h3>How it works</h3>
        <ul className="home__list">
          <li>
            Your trades live in <code>backend/db.json</code>, served by a local{' '}
            <code>json-server</code> on port 4000.
          </li>
          <li>
            The React frontend reads them through the <code>/api</code> proxy and derives every
            metric — win rate, P&amp;L, return, and hold time — on the fly.
          </li>
          <li>Nothing leaves your computer. Libraries are fetched only at install time.</li>
        </ul>
      </Card>
    </section>
  )
}
