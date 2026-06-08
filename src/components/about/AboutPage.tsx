import { ArrowUpRight, BookOpenText, BriefcaseBusiness, Users } from 'lucide-react'
import aboutInfoRaw from '../../../about-info.md?raw'

interface AboutService {
  title: string
  description: string
}

interface AboutContent {
  title: string
  overview: string[]
  services: AboutService[]
  notes: string[]
  links: string[]
}

function normalizeAboutCopy(value: string) {
  return value
    .replaceAll('\r\n', '\n')
    .replaceAll('â€‘', '-')
    .replaceAll('â€™', "'")
    .replaceAll('â€œ', '"')
    .replaceAll('â€\u009d', '"')
    .replaceAll('ðŸš€', '')
    .replaceAll('ðŸ“\u009d', '')
    .trim()
}

function parseAboutContent(raw: string): AboutContent {
  const normalized = normalizeAboutCopy(raw)
  const blocks = normalized
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)

  const overview: string[] = []
  const services: AboutService[] = []
  const notes: string[] = []
  const links = Array.from(new Set(normalized.match(/https?:\/\/\S+/g) ?? [])).map((url) =>
    url.replace(/[.)]+$/, ''),
  )

  for (const block of blocks) {
    if (block.startsWith('## ')) continue

    const lines = block
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    const titleMatch = lines[0]?.match(/^(?:[^\w\s]\s*)?\*\*(.+?)\*\*/)
    if (titleMatch) {
      services.push({
        title: titleMatch[1],
        description: lines.join(' ').replace(/^(?:[^\w\s]\s*)?\*\*.+?\*\*\s*/, '').trim(),
      })
      continue
    }

    if (!services.length) {
      overview.push(lines.join(' '))
      continue
    }

    notes.push(lines.join(' '))
  }

  const titleMatch = overview[0]?.match(/^The (.+?) is designed/i)

  return {
    title: titleMatch?.[1] ?? 'About',
    overview,
    services,
    notes,
    links,
  }
}

function getLinkLabel(url: string) {
  if (url.includes('pmresume')) return 'Resume Template'
  if (url.includes('youtube.com')) return 'YouTube Channel'
  return 'Open Resource'
}

const aboutContent = parseAboutContent(aboutInfoRaw)

export function AboutPage() {
  return (
    <section className="about-page" aria-labelledby="about-title">
      <section className="about-hero">
        <div className="about-copy">
          <span className="about-eyebrow">About</span>
          <h1 id="about-title">{aboutContent.title}</h1>
          {aboutContent.overview.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <aside className="about-summary glass-card" aria-label="Program summary">
          <div className="about-summary-item">
            <BriefcaseBusiness aria-hidden size={20} />
            <div>
              <strong>{aboutContent.services.length} core offerings</strong>
              <span>Programs spanning job search, AI product work, leadership growth, and resume support.</span>
            </div>
          </div>
          <div className="about-summary-item">
            <Users aria-hidden size={20} />
            <div>
              <strong>Built for every PM stage</strong>
              <span>From entry-level candidates to senior leaders preparing for executive scope.</span>
            </div>
          </div>
          <div className="about-summary-item">
            <BookOpenText aria-hidden size={20} />
            <div>
              <strong>Free learning resources included</strong>
              <span>Supplemented by public training, courses, templates, and community content.</span>
            </div>
          </div>
        </aside>
      </section>

      <section className="about-section">
        <div className="about-section-heading">
          <span>Programs</span>
          <h2>What the program offers</h2>
        </div>
        <div className="about-service-grid">
          {aboutContent.services.map((service) => (
            <article className="about-service-card glass-card" key={service.title}>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-section about-resources">
        <div className="about-section-heading">
          <span>Resources</span>
          <h2>Where to continue</h2>
        </div>

        <div className="about-resource-layout">
          <div className="about-resource-copy">
            {aboutContent.notes.map((note) => (
              <p key={note}>{note}</p>
            ))}
          </div>

          <div className="about-link-list">
            {aboutContent.links.map((url) => (
              <a
                className="about-link-card glass-card"
                href={url}
                key={url}
                rel="noreferrer"
                target="_blank"
              >
                <div>
                  <strong>{getLinkLabel(url)}</strong>
                  <span>{url.replace(/^https?:\/\//, '')}</span>
                </div>
                <ArrowUpRight aria-hidden size={18} />
              </a>
            ))}
          </div>
        </div>
      </section>
    </section>
  )
}
