import React from 'react'
import './home.css'

const Home: React.FC = () => {
  return (
    <div className="home">
      <header className="site-header">
        <div className="logo">
          <img src="/src/assets/antara.svg" alt="Antara logo" className="logo-img" />
          <span className="brand">Antara</span>
        </div>
        <nav className="nav">
          <a href="#">Overview</a>
          <a href="#">Docs</a>
          <a href="#">Contact</a>
        </nav>
      </header>

      <main className="hero">
        <div className="hero-content">
          <h1>Introducing Antara</h1>
          <p className="lead">A modern design system to help you build beautiful interfaces.</p>
          <div className="cta">
            <button className="btn primary">Get Started</button>
            <button className="btn ghost">Learn More</button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Home
