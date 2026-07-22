import kyleImage from './assets/kyle-douglas.jpeg'
import lukeImage from './assets/luke-edwards.jpeg'
import andrewImage from './assets/andy-buckwinkler.jpeg'
import TransformationCarousel from './TransformationCarousel'
import { transformations } from './transformations'

const trainers = [
  {
    name: 'Luke Edwards',
    role: 'Co-founder · Head trainer',
    image: lukeImage,
    alt: 'Luke Edwards competing on a bodybuilding stage',
    specialties: ['Strength training', 'Bodybuilding', 'Nutrition'],
    bio: 'Luke brings years of bodybuilding and strength-training experience to every session. His coaching combines proven training principles with practical guidance to help clients build muscle, gain strength, and create results that last.',
  },
  {
    name: 'Kyle Douglas',
    role: 'Co-founder · Head trainer',
    image: kyleImage,
    alt: 'Kyle Douglas showing his athletic physique',
    specialties: ['Athletic performance', 'Body composition', 'Functional training'],
    bio: 'Kyle creates personal training plans that meet each client where they are. His experience in bodybuilding and athletic performance, paired with a motivating and detail-focused approach, helps clients keep moving forward.',
  },
  {
    name: 'Andrew Buckwinkler',
    role: 'Personal trainer',
    image: andrewImage,
    alt: 'Andrew Buckwinkler',
    specialties: ['Weight loss', 'Sustainable habits', 'Personalized programs'],
    bio: 'Andrew specializes in weight loss, bringing both professional expertise and real-life experience to his coaching. In 2018, he weighed over 300 lbs and transformed his health by setting realistic goals, building sustainable workouts, and learning how differently every body functions. That journey drives his passion for helping others achieve lasting results through personalized programs and sustainable, long-term change.',
  },
]

function App() {
  const contactFormUrl = import.meta.env.VITE_GOOGLE_FORM_URL?.trim()
  const contactHref = contactFormUrl || '#contact'
  const contactLinkProps = contactFormUrl
    ? { target: '_blank', rel: 'noreferrer' }
    : { 'data-unconfigured': true }

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="BDE Personal Training home">
          BDE <span>P.T.</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#transformations">Results</a>
          <a href="#trainers">Trainers</a>
          <a href="#story">Our story</a>
          <a className="nav-cta" href={contactHref} {...contactLinkProps}>
            Contact <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <p className="eyebrow">Personal training · Built around you</p>
          <h1 id="hero-title">
            Strength,{' '}
            <span>with intention.</span>
          </h1>
          <p className="hero-copy">
            Personalized coaching for lasting strength, deliberate progress, and a body built with purpose.
          </p>
          <a className="button" href={contactHref} {...contactLinkProps}>
            Start your journey <span aria-hidden="true">↗</span>
          </a>
          <div className="hero-rule" aria-hidden="true">
            <span>Bodybuilding</span>
            <span>Strength</span>
            <span>Performance</span>
          </div>
        </section>

        {transformations.length > 0 && (
          <TransformationCarousel transformations={transformations} />
        )}

        <section className="trainers section" id="trainers" aria-labelledby="trainers-title">
          <div className="section-heading">
            <p className="eyebrow">The team</p>
            <h2 id="trainers-title">Meet your trainers.</h2>
            <p>Three coaches. One shared commitment to thoughtful training and sustainable results.</p>
          </div>

          <div className="trainer-grid">
            {trainers.map((trainer, index) => (
              <article className="trainer" key={trainer.name}>
                <div className="trainer-photo">
                  <img src={trainer.image} alt={trainer.alt} />
                  <span className="trainer-index" aria-hidden="true">0{index + 1}</span>
                </div>
                <div className="trainer-content">
                  <p className="eyebrow">{trainer.role}</p>
                  <h3>{trainer.name}</h3>
                  <p>{trainer.bio}</p>
                  <ul aria-label={`${trainer.name}'s specialties`}>
                    {trainer.specialties.map((specialty) => <li key={specialty}>{specialty}</li>)}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="story section" id="story" aria-labelledby="story-title">
          <div className="story-heading">
            <p className="eyebrow">Northern Illinois University · 2019</p>
            <h2 id="story-title">Roommates.<br />Training partners.<br />Coaches.</h2>
          </div>
          <div className="story-copy">
            <p>
              Our journey began in 2019 at Northern Illinois University, where Luke and Kyle first met as roommates. What started as a simple living arrangement quickly became a deep friendship built on mutual respect and a shared passion for fitness.
            </p>
            <p>
              Kyle, already immersed in bodybuilding, introduced Luke to the sport that would change both of their lives. Through early gym sessions, late-night meal prep, and countless conversations about training, they discovered a shared calling to help others transform through proper training and nutrition.
            </p>
            <p>
              Years of learning, growing, and competing together led to BDE P.T.—a place to pass on the knowledge and passion that brought them together and help others discover their own strength and potential.
            </p>
          </div>
        </section>

        <section className="contact section" id="contact" aria-labelledby="contact-title">
          <p className="eyebrow">Ready when you are</p>
          <h2 id="contact-title">Build what lasts.</h2>
          <p>Tell us where you are, where you want to go, and what has been holding you back.</p>
          <a className="button button-light" href={contactHref} {...contactLinkProps}>
            Apply for coaching <span aria-hidden="true">↗</span>
          </a>
          {!contactFormUrl && (
            <p className="config-note" role="status">
              Set <code>VITE_GOOGLE_FORM_URL</code> at build time to enable this link.
            </p>
          )}
        </section>
      </main>

      <footer>
        <a className="brand" href="#top">BDE <span>P.T.</span></a>
        <p>Buckwinkler, Douglas, &amp; Edwards Personal Training</p>
        <p>© {new Date().getFullYear()} BDE P.T.</p>
      </footer>
    </div>
  )
}

export default App
