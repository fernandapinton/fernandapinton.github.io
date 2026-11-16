import { ArrowDownIcon, ArrowRightIcon, ArrowUpIcon, ArrowUpRightIcon, AsteriskIcon } from '@phosphor-icons/react'
import heroImage from './assets/fernanda-microfone.jpg'
import './App.css'

// Personalize a apresentação, a bio, os projetos e os links neste bloco.
const profile = {
  firstName: 'Fernanda',
  lastName: 'Pinton',
  role: 'Cantora',
  intro: 'Conheça meu trabalho com a voz, das gravações às apresentações ao vivo.',
  bio: 'Sou Fernanda Pinton, musicista e cantora. Criei este espaço para compartilhar meu percurso na música e encontrar pessoas que queiram criar comigo.',
  email: 'contato@example.com',
  instagram: '', // Insira a URL completa do perfil.
  youtube: '',
  spotify: '',
}

// Substitua os exemplos por trabalhos reais e adicione as URLs para ouvir ou assistir.
const projects = [
  {
    name: 'Apresentação ao vivo',
    category: 'Palco',
    description: 'Espaço para o vídeo de uma apresentação, com o repertório e o local do show.',
    cover: 'palco',
    artwork: 'ao vivo',
    href: '',
  },
  {
    name: 'Gravação em estúdio',
    category: 'Gravação',
    description: 'Espaço para uma faixa gravada, com o link para ouvir e os créditos da produção.',
    cover: 'estudio',
    artwork: 'estúdio',
    href: '',
  },
  {
    name: 'Colaboração musical',
    category: 'Parcerias',
    description: 'Espaço para uma participação vocal, com os artistas envolvidos e o link do projeto.',
    cover: 'parcerias',
    artwork: 'em parceria',
    href: '',
  },
]

function App() {
  const name = `${profile.firstName} ${profile.lastName}`
  const contacts = [
    { label: profile.email, href: `mailto:${profile.email}` },
    { label: 'Instagram', href: profile.instagram },
    { label: 'YouTube', href: profile.youtube },
    { label: 'Spotify', href: profile.spotify },
  ].filter(({ href }) => href)

  return (
    <>
      <a className="skip-link" href="#conteudo">Ir para o conteúdo</a>
      <header className="site-header" id="inicio">
        <div className="shell header-inner">
          <a className="wordmark" href="#inicio" aria-label={`${name}, início`}>
            {profile.firstName} <em>{profile.lastName}</em>
          </a>
          <nav aria-label="Navegação principal">
            <a href="#trabalhos">Trabalhos</a>
            <a href="#sobre">Sobre</a>
            <a className="nav-contact" href="#contato">Contato <ArrowUpRightIcon aria-hidden="true" /></a>
          </nav>
        </div>
      </header>

      <main id="conteudo">
        <section className="hero" aria-labelledby="intro">
          <div className="shell hero-inner">
            <div className="hero-copy">
              <p className="eyebrow">{profile.role}</p>
              <h1 id="intro">{profile.firstName} <em>{profile.lastName}<span>.</span></em></h1>
              <p className="hero-description">{profile.intro}</p>
              <div className="hero-actions">
                <a className="primary-link" href="#trabalhos">Ver trabalhos <ArrowDownIcon weight="bold" aria-hidden="true" /></a>
                <a className="text-link" href="#sobre">Sobre mim <ArrowRightIcon weight="bold" aria-hidden="true" /></a>
              </div>
            </div>
            <div className="hero-art">
              <div className="hero-photo">
                <img src={heroImage} alt="Microfone sobre veludo escuro, com luz verde e laranja" width="1374" height="1145" fetchPriority="high" />
              </div>
              <AsteriskIcon className="hero-spark" weight="bold" aria-hidden="true" />
            </div>
          </div>
        </section>

        <section className="work section shell" id="trabalhos" aria-labelledby="work-title">
          <div className="section-heading">
            <h2 id="work-title">Trabalhos selecionados<span>.</span></h2>
            <p>Projetos de exemplo</p>
          </div>
          <div className="project-grid">
            {projects.map((project) => (
              <article className="project" key={project.name}>
                <div className={`project-art project-art--${project.cover}`} aria-hidden="true">
                  <span>{project.artwork}</span>
                </div>
                <div className="project-copy">
                  <p className="project-category">{project.category}</p>
                  <h3>
                    {project.href ? (
                      <a className="text-link" href={project.href}>{project.name} <ArrowUpRightIcon aria-hidden="true" /></a>
                    ) : project.name}
                  </h3>
                  <p className="project-description">{project.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="about" id="sobre" aria-labelledby="about-title">
          <div className="shell about-inner">
            <h2 id="about-title">Sobre mim<span>.</span></h2>
            <p>{profile.bio}</p>
          </div>
        </section>

        <section className="contact" id="contato" aria-labelledby="contact-title">
          <div className="shell contact-inner">
            <div>
              <h2 id="contact-title">Vamos conversar?</h2>
              <p>Para convites de shows, participações e parcerias musicais.</p>
            </div>
            <ul aria-label="Links de contato">
              {contacts.map(({ label, href }) => (
                <li key={label}><a href={href}>{label} <ArrowUpRightIcon weight="bold" aria-hidden="true" /></a></li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="shell site-footer">
        <span>© {name}</span>
        <a className="text-link" href="#inicio">Voltar ao topo <ArrowUpIcon aria-hidden="true" /></a>
      </footer>
    </>
  )
}

export default App
