import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowDown, ArrowUp, ArrowUpRight, Binary, Braces, Code2, Database, Github, Layers3, Linkedin, Mail, Menu, Monitor, Network, Smartphone, X } from 'lucide-react'
import { engineering, principles, profile, skills } from './profile'
import './style.css'

type Summary = { slug: string; title: string; type: string; status: string; summary: string }
type Project = Summary & {
  problem: string; goal: string; features: string[]; architecture: string[]; technologies: string[]
  participation: string; demo?: string; repository?: string
}

function useData<T>(path: string) {
  const [data, setData] = useState<T>()
  const [error, setError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    fetch(path, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error(response.status === 404 ? 'Proyecto no encontrado.' : 'No se pudo cargar el contenido.')
        return response.json() as Promise<T>
      })
      .then(setData)
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'No se pudo cargar el contenido.')
      })
    return () => controller.abort()
  }, [path])
  return { data, error }
}

const nav = [['Proyectos', 'proyectos'], ['Sobre mí', 'sobre-mi'], ['Habilidades', 'habilidades'], ['Contacto', 'contacto']]

function Header() {
  const [open, setOpen] = useState(false)
  return <header className="header" id="inicio">
    <div className="wrap nav">
      <a className="brand" href="/" aria-label="MJ, inicio"><span className="monogram">MJ<span>.</span></span><span>Portfolio</span></a>
      <button className="menu" type="button" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-controls="navigation" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      <nav id="navigation" aria-label="Principal" className={open ? 'open' : ''}>
        {nav.map(([label, id]) => <a key={id} href={'/#' + id} onClick={() => setOpen(false)}>{label}</a>)}
      </nav>
    </div>
  </header>
}

function ArchitectureArt() {
  return <div className="architecture-art" aria-hidden="true">
    <div className="art-heading"><Braces size={15} /> <span>system.architecture</span><i /></div>
    <div className="art-map">
      <div className="art-node art-left"><Monitor size={16} /><span>Web</span></div>
      <div className="art-node art-right"><Smartphone size={16} /><span>Móvil</span></div>
      <div className="art-core"><Layers3 size={35} /></div>
      <div className="art-node art-data"><Database size={16} /><span>Datos</span></div>
    </div>
    <div className="art-footer"><span>INTERFACES</span><span>·</span><span>SERVICIOS</span><span>·</span><span>PERSISTENCIA</span></div>
  </div>
}

function Hero() {
  return <section className="hero wrap">
    <div className="hero-copy">
      <p className="eyebrow hero-role"><span className="role-line" /> Software Developer <span className="muted">/</span> Systems Engineering Student</p>
      <h1>Transformando ideas en <em>soluciones tecnológicas.</em></h1>
      <p className="hero-description">Diseño y desarrollo soluciones digitales que conectan software, datos y tecnología para resolver problemas reales.</p>
      <div className="actions">
        <a className="button primary" href="#proyectos">Explorar proyectos <ArrowDown size={16} /></a>
        <a className="button secondary" href="#contacto">Contactarme</a>
        {profile.github && <a className="icon-link" aria-label="GitHub" href={profile.github}><Github size={20} /></a>}
        {profile.linkedin && <a className="icon-link" aria-label="LinkedIn" href={profile.linkedin}><Linkedin size={20} /></a>}
      </div>
    </div>
    <ArchitectureArt />
  </section>
}

function ProjectArt({ slug }: { slug: string }) {
  if (slug === 'gestion-hotelera') {
    return <div className="hotel-art" aria-hidden="true">
      <div className="app-window">
        <div className="app-top"><span /><span /><span /><small>Hotel / Administración</small></div>
        <div className="app-body">
          <div className="app-sidebar"><Layers3 size={17} /><i /><i /><i /><i /></div>
          <div className="app-content"><strong>Panel del hotel</strong><div className="app-modules"><span>Operaciones</span><span>Habitaciones</span></div><div className="app-table"><i /><i /><i /></div></div>
        </div>
      </div>
      <div className="app-phone"><i /><Smartphone size={18} /><strong>Mi estancia</strong><span>Cliente</span><b /><b /></div>
    </div>
  }
  const isNetwork = slug === 'redes-cisco'
  const isPipeline = slug === 'pipeline-de-tareas'
  const Item = isNetwork ? Network : isPipeline ? Binary : Layers3
  const title = isNetwork ? 'Topología LAN' : isPipeline ? 'Flujo de procesamiento' : 'Panel veterinario'
  const stages = isNetwork ? ['Clientes IPv4', 'Switch de acceso', 'DHCPv4'] : isPipeline ? ['Entrada', 'Filtros', 'Persistencia'] : ['Pacientes', 'Clientes', 'Personal']
  return <div className={'mini-art ' + slug} aria-hidden="true">
    <div className="project-preview">
      <div className="preview-title"><Item size={15} /><span>{title}</span></div>
      <div className="preview-stages">{stages.map(stage => <span key={stage}>{stage}</span>)}</div>
    </div>
  </div>
}

function ProjectCard({ project }: { project: Summary }) {
  return <a className={'project-card ' + (project.slug === 'gestion-hotelera' ? 'featured' : '')} href={'/proyectos/' + project.slug} aria-label={'Ver proyecto: ' + project.title}>
    <ProjectArt slug={project.slug} />
    <div className="project-copy">
      <p className="eyebrow">{project.type}</p>
      <h3>{project.title}</h3>
      <p>{project.summary}</p>
      <span className="project-link">Ver caso de estudio <ArrowUpRight size={16} /></span>
    </div>
  </a>
}

function Projects() {
  const { data, error } = useData<Summary[]>('/api/projects')
  return <section id="proyectos" className="wrap section">
    <p className="eyebrow">Portafolio</p>
    <h2>Proyectos destacados<span className="accent">.</span></h2>
    <p className="section-intro">Sistemas multiplataforma, arquitectura de software y prácticas de infraestructura.</p>
    {error ? <p role="alert">{error}</p> : !data ? <p role="status">Cargando proyectos…</p> : <div className="projects">{data.map(project => <ProjectCard key={project.slug} project={project} />)}</div>}
  </section>
}

function Tags({ items }: { items: string[] }) {
  return <ul className="tags">{items.map(item => <li key={item}>{item}</li>)}</ul>
}

function ProfileSections() {
  return <>
    <section id="sobre-mi" className="section wrap split">
      <div><p className="eyebrow">Perfil</p><h2>Sobre mí<span className="accent">.</span></h2></div>
      <div className="prose-copy"><p>Soy estudiante universitaria del área tecnológica y desarrolladora de software en formación. En mis proyectos académicos diseño sistemas de gestión, desarrollo aplicaciones web y móviles e integro bases de datos.</p>
        <p>Me interesa entender cómo se conectan las interfaces, la lógica, los datos y la infraestructura. Quiero seguir profundizando en desarrollo full stack, arquitectura de sistemas, redes y fundamentos de ciberseguridad para construir soluciones mantenibles que respondan a necesidades reales.</p></div>
    </section>
    <section id="habilidades" className="section wrap">
      <p className="eyebrow">Áreas de trabajo</p><h2>Habilidades técnicas<span className="accent">.</span></h2>
      <div className="skills-grid">{skills.map(([category, ...items]) => <article className="skill" key={category}><h3>{category}</h3><Tags items={items} /></article>)}</div>
    </section>
    <section className="section wrap split" id="ingenieria">
      <div><p className="eyebrow">Metodología</p><h2>Ingeniería de software<span className="accent">.</span></h2><p className="section-intro">Principios que orientan mi forma de diseñar y mantener sistemas.</p><Tags items={principles} /></div>
      <ol className="workflow">{engineering.map(step => <li key={step}>{step}</li>)}</ol>
    </section>
    <section className="section wrap split" id="formacion">
      <div><p className="eyebrow">Educación</p><h2>Formación<span className="accent">.</span></h2></div>
      <div className="skill education"><h3>Estudiante universitaria</h3><dl><dt>Carrera</dt><dd>{profile.program || 'Por confirmar'}</dd><dt>Universidad</dt><dd>{profile.university || 'Por confirmar'}</dd><dt>Cursos, certificaciones y logros</dt><dd>{profile.learning.join(' · ') || 'Por completar'}</dd></dl></div>
    </section>
    <section className="section wrap" id="contacto">
      <div className="contact-box"><p className="eyebrow">Contacto · Bolivia</p><h2>¿Construimos algo interesante?</h2>
        <p className="section-intro">Estoy abierta a nuevas oportunidades de aprendizaje, colaboración y desarrollo profesional en el mundo tecnológico.</p>
        <div className="contact-links">
          {([[Mail, 'Correo electrónico', profile.email && 'mailto:' + profile.email], [Github, 'GitHub', profile.github], [Linkedin, 'LinkedIn', profile.linkedin]] as const).map(([Icon, label, url]) => url ? <a key={label} className="button secondary" href={url}><Icon size={17} />{label}</a> : <span key={label} className="contact-pending"><Icon size={17} />{label} · Por confirmar</span>)}
        </div>
      </div>
    </section>
  </>
}

function Detail({ slug }: { slug: string }) {
  const { data, error } = useData<Project>('/api/projects/' + encodeURIComponent(slug))
  useEffect(() => { if (data) document.title = data.title + ' — MJ' }, [data])
  return <div className="wrap detail">
    <a className="project-link" href="/#proyectos">Volver a proyectos</a>
    {error ? <h1>{error}</h1> : !data ? <p role="status">Cargando proyecto…</p> : <>
      <p className="eyebrow detail-type">{data.type} · {data.status}</p>
      <h1>{data.title}<span className="accent">.</span></h1>
      <p className="hero-description">{data.summary}</p>
      <figure className="detail-art"><ProjectArt slug={slug} /><figcaption>Representación conceptual del proyecto</figcaption></figure>
      <div className="detail-grid">
        <section><h2>Problema</h2><p>{data.problem}</p><h2>Objetivo</h2><p>{data.goal}</p><h2>Mi participación</h2><p>{data.participation}</p></section>
        <section><h2>Funcionalidades</h2><ul>{data.features.map(feature => <li key={feature}>{feature}</li>)}</ul><h2>Tecnologías</h2>{data.technologies.length ? <Tags items={data.technologies} /> : <p>Tecnologías por confirmar.</p>}</section>
      </div>
      <section className="detail-architecture"><h2>Arquitectura</h2><ol className="workflow">{data.architecture.map(step => <li key={step}>{step}</li>)}</ol></section>
      <div className="actions">{data.demo && <a className="button primary" href={data.demo}>Demostración</a>}{data.repository && <a className="button secondary" href={data.repository}>Repositorio</a>}</div>
    </>}
  </div>
}

function App() {
  const match = /^\/proyectos\/([^/]+)\/?$/.exec(window.location.pathname)
  return <>
    <a className="skip" href="#contenido">Saltar al contenido</a>
    <Header />
    <main id="contenido">{match ? <Detail slug={match[1]} /> : <><Hero /><Projects /><ProfileSections /></>}</main>
    <footer className="wrap footer"><span className="brand"><Code2 size={19} /> MJ · Portafolio</span><a href="#inicio">Volver arriba <ArrowUp size={16} /></a></footer>
  </>
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
