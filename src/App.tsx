import { useEffect, useState } from 'react'
import { Link, Route, Routes, useLocation, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import blogContent from 'virtual:bde-blogs'
import kyleImage from './assets/kyle-douglas.jpeg'
import lukeImage from './assets/luke-edwards.jpeg'
import andrewImage from './assets/andy-buckwinkler.jpeg'
import type { Blog, BlogPost } from './blogTypes'
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

type AppProps = {
  blogs?: Blog[]
}

const usePageTitle = (title: string) => {
  useEffect(() => {
    document.title = title
  }, [title])
}

const formatDate = (date: string) => new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
}).format(new Date(`${date}T00:00:00Z`))

const blogMediaBase = (
  import.meta.env.VITE_BLOG_MEDIA_BASE?.trim()
  || `${import.meta.env.BASE_URL}blog-media/`
).replace(/\/?$/, '/')

const blogMediaUrl = (mediaPath: string) =>
  `${blogMediaBase}${mediaPath.replace(/^blog-media\//, '')}`

function ScrollToLocation() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.slice(1))
      element?.scrollIntoView?.()
      return
    }

    window.scrollTo?.(0, 0)
  }, [pathname, hash])

  return null
}

function SiteHeader() {
  const contactFormUrl = import.meta.env.VITE_GOOGLE_FORM_URL?.trim()
  const { pathname } = useLocation()

  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="BDE Personal Training home">
        BDE <span>P.T.</span>
      </Link>
      <nav aria-label="Primary navigation">
        <Link to="/#transformations">Results</Link>
        <Link to="/#trainers">Trainers</Link>
        <Link to="/#story">Our story</Link>
        <Link
          className="blogs-link"
          to="/blogs"
          aria-current={pathname.startsWith('/blogs') ? 'page' : undefined}
        >
          Blogs
        </Link>
        {contactFormUrl ? (
          <a className="nav-cta" href={contactFormUrl} target="_blank" rel="noreferrer">
            Contact <span aria-hidden="true">↗</span>
          </a>
        ) : (
          <Link className="nav-cta" to="/#contact">
            Contact <span aria-hidden="true">↗</span>
          </Link>
        )}
      </nav>
    </header>
  )
}

function SiteFooter() {
  return (
    <footer>
      <Link className="brand" to="/">BDE <span>P.T.</span></Link>
      <p>Buckwinkler, Douglas, &amp; Edwards Personal Training</p>
      <p>© {new Date().getFullYear()} BDE P.T.</p>
    </footer>
  )
}

function HomePage() {
  usePageTitle('BDE P.T. | Personal Training')
  const contactFormUrl = import.meta.env.VITE_GOOGLE_FORM_URL?.trim()

  const contactButton = (className: string, label: string) => contactFormUrl ? (
    <a className={className} href={contactFormUrl} target="_blank" rel="noreferrer">
      {label} <span aria-hidden="true">↗</span>
    </a>
  ) : (
    <Link className={className} to="/#contact">
      {label} <span aria-hidden="true">↗</span>
    </Link>
  )

  return (
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
        {contactButton('button', 'Start your journey')}
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
        {contactButton('button button-light', 'Apply for coaching')}
        {!contactFormUrl && (
          <p className="config-note" role="status">
            Set <code>VITE_GOOGLE_FORM_URL</code> at build time to enable this link.
          </p>
        )}
      </section>
    </main>
  )
}

function PageIntro({ eyebrow, title, description }: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <header className="page-intro">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  )
}

function BlogsPage({ blogs }: { blogs: Blog[] }) {
  usePageTitle('Blogs | BDE P.T.')

  return (
    <main className="content-page">
      <PageIntro
        eyebrow="Trainer perspectives"
        title="Blogs."
        description="Training ideas, practical programming, and lessons from the BDE coaching team."
      />
      {blogs.length > 0 ? (
        <div className="blog-grid" aria-label="Trainer blogs">
          {blogs.map((blog) => (
            <article className="blog-card" key={blog.slug}>
              <p className="eyebrow">By {blog.trainer.name}</p>
              <h2><Link to={`/blogs/${blog.slug}`}>{blog.title}</Link></h2>
              <p>{blog.description}</p>
              <div className="card-meta">
                <span>{blog.posts.length} {blog.posts.length === 1 ? 'post' : 'posts'}</span>
                <Link to={`/blogs/${blog.slug}`} aria-label={`Read ${blog.title}`}>
                  View blog <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No blogs yet." message="Trainer perspectives will appear here when they are published." />
      )}
    </main>
  )
}

function Breadcrumbs({ blog, post }: { blog?: Blog; post?: BlogPost }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/blogs">Blogs</Link></li>
        {blog && (
          <li>
            {post ? <Link to={`/blogs/${blog.slug}`}>{blog.title}</Link> : <span aria-current="page">{blog.title}</span>}
          </li>
        )}
        {post && <li><span aria-current="page">{post.title}</span></li>}
      </ol>
    </nav>
  )
}

function BlogPage({ blogs }: { blogs: Blog[] }) {
  const { blogSlug } = useParams()
  const blog = blogs.find((item) => item.slug === blogSlug)
  const [visiblePostCount, setVisiblePostCount] = useState(12)
  usePageTitle(blog ? `${blog.title} | BDE P.T.` : 'Blog not found | BDE P.T.')

  useEffect(() => {
    setVisiblePostCount(12)
  }, [blogSlug])

  if (!blog) {
    return <NotFoundPage kind="blog" />
  }

  const visiblePosts = blog.posts.slice(0, visiblePostCount)

  return (
    <main className="content-page">
      <Breadcrumbs blog={blog} />
      <PageIntro
        eyebrow={`By ${blog.trainer.name}`}
        title={blog.title}
        description={blog.description}
      />
      {blog.posts.length > 0 ? (
        <>
          <div className="post-list" aria-label={`Posts from ${blog.title}`}>
            {visiblePosts.map((post) => {
              const cover = post.media?.[0]
              const postUrl = `/blogs/${blog.slug}/${post.slug}`

              return (
                <article
                  className={`post-card${cover ? ' post-card-with-cover' : ''}`}
                  key={post.slug}
                >
                  {cover && (
                    <Link className="post-cover" to={postUrl} tabIndex={-1} aria-hidden="true">
                      <img
                        src={blogMediaUrl(cover.path)}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                    </Link>
                  )}
                  <time dateTime={post.publishedDate}>{formatDate(post.publishedDate)}</time>
                  <h2><Link to={postUrl}>{post.title}</Link></h2>
                  <p>{post.summary}</p>
                  <Link className="text-link" to={postUrl}>
                    Read article <span aria-hidden="true">→</span>
                  </Link>
                </article>
              )
            })}
          </div>
          {visiblePostCount < blog.posts.length && (
            <div className="load-more">
              <button
                className="button"
                type="button"
                onClick={() => setVisiblePostCount((count) => count + 12)}
              >
                Load more
                <span aria-hidden="true">↓</span>
              </button>
              <p aria-live="polite">
                Showing {visiblePosts.length} of {blog.posts.length} posts
              </p>
            </div>
          )}
        </>
      ) : (
        <EmptyState title="No posts yet." message={`${blog.trainer.name} hasn't published a post here yet.`} />
      )}
    </main>
  )
}

function BlogPostPage({ blogs }: { blogs: Blog[] }) {
  const { blogSlug, postSlug } = useParams()
  const blog = blogs.find((item) => item.slug === blogSlug)
  const post = blog?.posts.find((item) => item.slug === postSlug)
  usePageTitle(post ? `${post.title} | BDE P.T.` : 'Post not found | BDE P.T.')

  if (!blog) return <NotFoundPage kind="blog" />
  if (!post) return <NotFoundPage kind="post" blog={blog} />

  return (
    <main className="content-page article-page">
      <Breadcrumbs blog={blog} post={post} />
      <article>
        <header className="article-header">
          <p className="eyebrow">{blog.title} · {blog.trainer.name}</p>
          <h1>{post.title}</h1>
          <p>{post.summary}</p>
          <time dateTime={post.publishedDate}>Published {formatDate(post.publishedDate)}</time>
        </header>
        {post.media && (
          <section className="article-gallery" aria-label={`Media from ${post.title}`}>
            <div className="article-gallery-track" tabIndex={0}>
              {post.media.map((media, index) => (
                <figure className="article-media" key={`${media.path}-${index}`}>
                  {media.type === 'image' ? (
                    <img
                      src={blogMediaUrl(media.path)}
                      alt={media.alt}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                    />
                  ) : (
                    <video
                      src={blogMediaUrl(media.path)}
                      aria-label={media.alt}
                      controls
                      playsInline
                      preload="metadata"
                    />
                  )}
                  <figcaption>{index + 1} / {post.media?.length}</figcaption>
                </figure>
              ))}
            </div>
            {post.media.length > 1 && (
              <p className="gallery-hint">Swipe or scroll to see the full post.</p>
            )}
          </section>
        )}
        <div className="markdown-body">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            skipHtml
            components={{ h1: 'h2' }}
          >
            {post.content}
          </ReactMarkdown>
        </div>
      </article>
    </main>
  )
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <section className="empty-state" aria-labelledby="empty-state-title">
      <p className="eyebrow">Check back soon</p>
      <h2 id="empty-state-title">{title}</h2>
      <p>{message}</p>
    </section>
  )
}

function NotFoundPage({ kind = 'page', blog }: { kind?: 'page' | 'blog' | 'post'; blog?: Blog }) {
  const labels = {
    page: ['Page not found.', 'The page you requested does not exist.'],
    blog: ['Blog not found.', 'The blog you requested does not exist or may have moved.'],
    post: ['Post not found.', 'The article you requested does not exist or may have moved.'],
  } as const
  const [title, description] = labels[kind]
  usePageTitle(`${title} | BDE P.T.`)

  return (
    <main className="content-page not-found-page">
      {blog ? <Breadcrumbs blog={blog} /> : <Breadcrumbs />}
      <PageIntro eyebrow="404" title={title} description={description} />
      <Link className="button" to={blog ? `/blogs/${blog.slug}` : '/blogs'}>
        {blog ? `Back to ${blog.title}` : 'Browse blogs'} <span aria-hidden="true">→</span>
      </Link>
    </main>
  )
}

function App({ blogs = blogContent }: AppProps) {
  return (
    <div className="site-shell">
      <ScrollToLocation />
      <SiteHeader />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/blogs" element={<BlogsPage blogs={blogs} />} />
        <Route path="/blogs/:blogSlug" element={<BlogPage blogs={blogs} />} />
        <Route path="/blogs/:blogSlug/:postSlug" element={<BlogPostPage blogs={blogs} />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <SiteFooter />
    </div>
  )
}

export default App
