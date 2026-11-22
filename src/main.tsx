import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowDown, ArrowUp, ArrowUpRight, Binary, ChevronRight, Code2, Database, Github, Layers3, Linkedin, Mail, Menu, Network, Plus, ShieldCheck, Smartphone, Wrench, X } from 'lucide-react'
import { engineering, principles, profile, skills } from './profile'
import './style.css'

const hotelCover = new URL('./assets/recepcion-editorial.png', import.meta.url).href

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

const nav = [['Proyectos', 'proyectos'], ['Sobre mí', 'sobre-mi'], ['Habilidades', 'habilidades'], ['Ingeniería', 'ingenieria'], ['Contacto', 'contacto']]

function Header({ home }: { home: boolean }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('')
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    function update() {
      const distance = document.documentElement.scrollHeight - window.innerHeight
      const atEnd = distance > 0 && window.scrollY >= distance - 2
      setProgress(distance > 0 ? Math.min(1, window.scrollY / distance) : 0)
      if (home) {
        const current = [...nav].reverse().find(([, id]) => (document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) <= 145)
        setActive(atEnd ? 'contacto' : current?.[1] ?? '')
      }
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    const observer = new ResizeObserver(update)
    observer.observe(document.body)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      observer.disconnect()
    }
  }, [home])
  return <header className="header">
    <div className="wrap nav" onKeyDown={event => {
      if (event.key === 'Escape' && open) {
        setOpen(false)
        event.currentTarget.querySelector('button')?.focus()
      }
    }}>
      <a className="brand" href="/" aria-label="MJ, inicio"><span className="monogram">MJ<span>.</span></span><span>Portfolio</span></a>
      <button className="menu" type="button" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-controls="navigation" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      <nav id="navigation" aria-label="Principal" className={open ? 'open' : ''}>
        {nav.map(([label, id]) => <a key={id} href={(home ? '#' : '/#') + id} aria-current={active === id ? 'location' : undefined} onClick={() => setOpen(false)}>{label}<ChevronRight size={16} aria-hidden="true" /></a>)}
      </nav>
    </div>
    <div className="scroll-progress" aria-hidden="true" style={{ transform: `scaleX(${progress})` }} />
  </header>
}

function HeroArt() {
  return <figure className="hero-art" aria-hidden="true">
    <div className="hero-seal"><span>MJ</span></div>
    <figcaption>Portafolio · Ingeniería de software</figcaption>
  </figure>
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
    <HeroArt />
  </section>
}

function ProjectArt({ slug, cover = false }: { slug: string; cover?: boolean }) {
  if (slug === 'gestion-hotelera' && cover) {
    return <div className="hotel-cover"><img src={hotelCover} alt="" loading="lazy" decoding="async" /></div>
  }
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
  if (cover) {
    return <div className={'project-cover ' + slug} aria-hidden="true" />
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
    <div className="card-media">
      <ProjectArt slug={project.slug} cover />
      <span className="card-arrow" aria-hidden="true"><ArrowUpRight size={22} /></span>
    </div>
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
  const [filter, setFilter] = useState('')
  const categories = [...new Set(data?.map(project => project.type))]
  const visibleProjects = data?.filter(project => !filter || project.type === filter)
  return <div className="projects-band"><section id="proyectos" className="wrap section">
    <p className="eyebrow">Portafolio</p>
    <h2>Proyectos destacados<span className="accent">.</span></h2>
    <p className="section-intro">Sistemas multiplataforma, arquitectura de software y prácticas de infraestructura.</p>
    {data && <div className="project-filters" role="group" aria-label="Filtrar proyectos">
      {['', ...categories].map(category => <button key={category} type="button" aria-pressed={filter === category} onClick={() => setFilter(category)}>{category || 'Todos'}</button>)}
    </div>}
    {error ? <p role="alert">{error}</p> : !data ? <p role="status">Cargando proyectos…</p> : <div className="projects">{visibleProjects?.map(project => <ProjectCard key={project.slug} project={project} />)}</div>}
  </section></div>
}

function Tags({ items }: { items: string[] }) {
  return <ul className="tags">{items.map(item => <li key={item}>{item}</li>)}</ul>
}

const principleDescriptions: Record<string, string> = {
  'Clean Code': 'Escribir código fácil de entender y cambiar. Por ejemplo, usar nombres que expliquen la intención y funciones que hagan una sola tarea.',
  SOLID: 'Cinco principios de diseño orientado a objetos que facilitan probar y extender el código. Por ejemplo, separar el envío de correos de la lógica que registra a un usuario.',
  DRY: 'Mantener cada regla en un solo lugar. Si cambia cómo se calcula un total, basta con actualizar la función que comparten los módulos.',
  KISS: 'Elegir la solución más simple que cumple el requisito. Por ejemplo, usar una función directa cuando resuelve todo el problema.',
  YAGNI: 'Implementar una funcionalidad cuando hay una necesidad concreta. Así el equipo evita mantener código que nadie usa todavía.',
  'Separación de responsabilidades': 'Organizar el sistema por tareas claras. Por ejemplo, separar la interfaz, las reglas de negocio y el acceso a datos.',
  Modularidad: 'Dividir el sistema en piezas con límites claros para poder probarlas y modificarlas de forma independiente.',
  Escalabilidad: 'Preparar el sistema para responder cuando aumentan los usuarios o el volumen de datos.',
  Mantenibilidad: 'Facilitar que otras personas entiendan, corrijan y amplíen el sistema con código claro y pruebas.',
}

function Principles() {
  const [selected, setSelected] = useState(principles[0])
  const [preview, setPreview] = useState<string>()
  const shown = preview ?? selected
  return <div className="principles">
    <div className="principle-options" aria-label="Principios de ingeniería" role="group" onPointerLeave={() => setPreview(undefined)}>
      {principles.map(name => <button key={name} type="button" aria-pressed={selected === name}
        aria-controls="principle-description" data-preview={shown === name}
        onPointerEnter={event => { if (event.pointerType === 'mouse') setPreview(name) }}
        onClick={() => { setPreview(undefined); setSelected(name) }}>
        {name}<Plus size={14} aria-hidden="true" />
      </button>)}
    </div>
    <div className="principle-note" id="principle-description" aria-live={preview ? 'off' : 'polite'}>
      <div key={shown}><h3>{shown}</h3><p>{principleDescriptions[shown]}</p></div>
    </div>
  </div>
}

const skillIcons = [Code2, Database, Smartphone, Layers3, Network, ShieldCheck, Wrench]

function ProfileSections() {
  return <>
    <section id="sobre-mi" className="section wrap split">
      <div><p className="eyebrow">Perfil</p><h2>Sobre mí<span className="accent">.</span></h2></div>
      <div className="prose-copy"><p>Soy estudiante universitaria del área tecnológica y desarrolladora de software en formación. En mis proyectos académicos diseño sistemas de gestión, desarrollo aplicaciones web y móviles e integro bases de datos.</p>
        <p>Me interesa entender cómo se conectan las interfaces, la lógica, los datos y la infraestructura. Quiero seguir profundizando en desarrollo full stack, arquitectura de sistemas, redes y fundamentos de ciberseguridad para construir soluciones mantenibles que respondan a necesidades reales.</p></div>
    </section>
    <section id="habilidades" className="section wrap">
      <p className="eyebrow">Áreas de trabajo</p><h2>Habilidades técnicas<span className="accent">.</span></h2>
      <div className="skills-grid">{skills.map(([category, ...items], index) => {
        const Icon = skillIcons[index]
        return <article className="skill skill-card" key={category}><h3><Icon size={19} aria-hidden="true" />{category}</h3><Tags items={items} /></article>
      })}</div>
    </section>
    <section className="section wrap split" id="ingenieria">
      <div><p className="eyebrow">Metodología</p><h2>Ingeniería de software<span className="accent">.</span></h2><p className="section-intro">Explora los principios que aplico al diseñar sistemas.</p><Principles /></div>
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
          {([[Mail, 'Correo electrónico', profile.email && 'mailto:' + profile.email, 'Escríbeme'], [Github, 'GitHub', profile.github, 'Ver perfil'], [Linkedin, 'LinkedIn', profile.linkedin, 'Conectemos']] as const).map(([Icon, label, url, action]) => {
            const content = <><span className="contact-icon"><Icon size={20} aria-hidden="true" /></span><span><strong>{label}</strong><small>{url ? action : 'Por confirmar'}</small></span></>
            return url ? <a key={label} className="contact-card" href={url} target={url.startsWith('mailto:') ? undefined : '_blank'} rel="noopener noreferrer">{content}<ArrowUpRight size={17} aria-hidden="true" /></a> : <div key={label} className="contact-card contact-pending">{content}</div>
          })}
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
      <div className="detail-gallery">
        <figure className="detail-art"><ProjectArt slug={slug} cover /><figcaption>Imagen de referencia</figcaption></figure>
        <figure className="detail-art"><ProjectArt slug={slug} /><figcaption>Representación conceptual del proyecto</figcaption></figure>
      </div>
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
    <div id="inicio" />
    <a className="skip" href="#contenido">Saltar al contenido</a>
    <Header home={!match} />
    <main id="contenido">{match ? <Detail slug={match[1]} /> : <><Hero /><Projects /><ProfileSections /></>}</main>
    <footer className="wrap footer"><span className="brand"><Code2 size={19} /> MJ · Portafolio</span><a href="#inicio">Volver arriba <ArrowUp size={16} /></a></footer>
  </>
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
