import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import App from '../App'
import type { Blog } from '../blogTypes'

const blogs: Blog[] = [{
  slug: 'lukes-blog',
  title: "Luke's Blog",
  description: 'Training and programming notes.',
  trainer: { id: 'luke', name: 'Luke' },
  posts: [{
    slug: 'welcome',
    title: "Welcome to Luke's Blog",
    summary: 'An introduction.',
    publishedDate: '2026-07-22',
    content: [
      '## Useful details',
      '',
      '| Exercise | Sets |',
      '| --- | --- |',
      '| Squat | 3 |',
      '',
      '- [x] Train consistently',
      '',
      '<script>unsafe content</script>',
    ].join('\n'),
    media: [
      {
        type: 'image',
        path: 'blog-media/lukes-blog/welcome/0123456789abcdef.webp',
        alt: 'Welcome photo',
      },
      {
        type: 'video',
        path: 'blog-media/lukes-blog/welcome/fedcba9876543210.mp4',
        alt: 'Welcome video',
      },
    ],
  }],
}]

const LocationProbe = () => {
  const location = useLocation()
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>
}

const renderAt = (path: string, content: Blog[] = blogs) => render(
  <MemoryRouter initialEntries={[path]}>
    <App blogs={content} />
    <LocationProbe />
  </MemoryRouter>,
)

const makePosts = (count: number) => Array.from({ length: count }, (_, index) => ({
  ...blogs[0].posts[0],
  slug: `post-${index + 1}`,
  title: `Journey ${index + 1}`,
  summary: `Training notes for entry ${index + 1}.`,
  publishedDate: `2026-${String(12 - Math.floor(index / 28)).padStart(2, '0')}-${String(28 - (index % 28)).padStart(2, '0')}`,
  media: undefined,
}))

describe('blog routes', () => {
  it('prominently links Luke and Kyle to Instagram from the homepage', () => {
    renderAt('/')

    const lukeLinks = screen.getAllByRole('link', {
      name: 'Visit Luke Edwards on Instagram (@lwe_fitness)',
    })
    const kyleLinks = screen.getAllByRole('link', {
      name: 'Visit Kyle Douglas on Instagram (@kyle_pumps_iron)',
    })

    expect(screen.getByRole('heading', { name: 'Follow the founders.' })).toBeInTheDocument()
    expect(lukeLinks).toHaveLength(2)
    expect(kyleLinks).toHaveLength(2)
    lukeLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', 'https://www.instagram.com/lwe_fitness/')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noreferrer')
    })
    kyleLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', 'https://www.instagram.com/kyle_pumps_iron/')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noreferrer')
    })
    expect(screen.queryByRole('link', { name: /Andrew Buckwinkler on Instagram/ })).not.toBeInTheDocument()
  })

  it('links to the alphabetized blog listing from the primary navigation', async () => {
    const user = userEvent.setup()
    renderAt('/')

    await user.click(screen.getByRole('link', { name: 'Blogs' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Blogs.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: "Luke's Blog" })).toBeInTheDocument()
    expect(screen.getByText('1 post')).toBeInTheDocument()
  })

  it('navigates from a blog card to its newest-first post listing', async () => {
    const user = userEvent.setup()
    renderAt('/blogs')

    await user.click(screen.getByRole('link', { name: "Luke's Blog" }))

    expect(screen.getByRole('heading', { level: 1, name: "Luke's Blog" })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: "Welcome to Luke's Blog" })).toBeInTheDocument()
    expect(screen.getByText('July 22, 2026')).toHaveAttribute('datetime', '2026-07-22')
  })

  it('renders a directly linked GFM article safely with breadcrumbs', () => {
    renderAt('/blogs/lukes-blog/welcome')

    expect(screen.getByRole('heading', { level: 1, name: "Welcome to Luke's Blog" })).toBeInTheDocument()
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeChecked()
    expect(screen.queryByText('unsafe content')).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Welcome photo' })).toHaveAttribute(
      'src',
      '/blog-media/lukes-blog/welcome/0123456789abcdef.webp',
    )
    expect(screen.getByLabelText('Welcome video')).toHaveAttribute('controls')
    expect(screen.getByText('Swipe or scroll to see the full post.')).toBeInTheDocument()

    const breadcrumbs = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(within(breadcrumbs).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(within(breadcrumbs).getByRole('link', { name: 'Blogs' })).toHaveAttribute('href', '/blogs')
    expect(within(breadcrumbs).getByRole('link', { name: "Luke's Blog" })).toHaveAttribute(
      'href',
      '/blogs/lukes-blog',
    )
  })

  it('paginates long blog archives twelve posts at a time', async () => {
    const user = userEvent.setup()
    const posts = makePosts(25)

    renderAt('/blogs/lukes-blog', [{ ...blogs[0], posts }])

    expect(screen.getByRole('heading', { name: 'Journey 12' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Journey 13' })).not.toBeInTheDocument()
    expect(screen.getByText('Showing 1–12 of 25 posts')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByRole('link', { name: /Previous/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Page 2' }))

    expect(screen.getByRole('heading', { name: 'Journey 13' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Journey 24' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Journey 12' })).not.toBeInTheDocument()
    expect(screen.getByText('Showing 13–24 of 25 posts')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /Previous/ })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: /Next/ }))

    expect(screen.getByRole('heading', { name: 'Journey 25' })).toBeInTheDocument()
    expect(screen.getByText('Showing 25–25 of 25 posts')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Next/ })).not.toBeInTheDocument()
  })

  it('supports direct page links and normalizes invalid or out-of-range pages', async () => {
    const posts = makePosts(25)
    const content = [{ ...blogs[0], posts }]
    const { unmount } = renderAt('/blogs/lukes-blog?page=2', content)

    expect(screen.getByRole('heading', { name: 'Journey 13' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /Next/ })).toHaveAttribute(
      'href',
      '/blogs/lukes-blog?page=3',
    )
    unmount()

    const invalid = renderAt('/blogs/lukes-blog?page=not-a-page', content)
    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/blogs/lukes-blog')
    })
    expect(screen.getByRole('link', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page')
    invalid.unmount()

    renderAt('/blogs/lukes-blog?page=999', content)
    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/blogs/lukes-blog?page=3')
    })
    expect(screen.getByRole('heading', { name: 'Journey 25' })).toBeInTheDocument()
  })

  it('searches titles and summaries case-insensitively and can clear the query', async () => {
    const user = userEvent.setup()
    const posts = makePosts(15)
    posts[0].title = 'Strength Foundations'
    posts[0].summary = 'Build a reliable base.'
    posts[1].summary = 'Practical nutrition habits.'

    renderAt('/blogs/lukes-blog?page=2', [{ ...blogs[0], posts }])
    const search = screen.getByRole('searchbox', { name: 'Search this blog' })

    await user.type(search, 'STRENGTH')

    expect(screen.getByText('1 post found')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Strength Foundations' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Journey 15' })).not.toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/blogs/lukes-blog?q=STRENGTH')

    await user.clear(search)
    await user.type(search, 'nutrition')

    expect(screen.getByRole('heading', { name: 'Journey 2' })).toBeInTheDocument()
    expect(screen.getByText('1 post found')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(search).toHaveValue('')
    expect(screen.getByText('15 posts')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/blogs/lukes-blog')
  })

  it('preserves search terms while paging and shows an accessible no-results state', async () => {
    const user = userEvent.setup()
    const posts = makePosts(25)
    renderAt('/blogs/lukes-blog?q=journey&page=2', [{ ...blogs[0], posts }])

    expect(screen.getByRole('link', { name: /Next/ })).toHaveAttribute(
      'href',
      '/blogs/lukes-blog?q=journey&page=3',
    )
    expect(screen.getByRole('link', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page')

    const search = screen.getByRole('searchbox', { name: 'Search this blog' })
    await user.clear(search)
    await user.type(search, 'does not exist')

    expect(screen.getByRole('heading', { name: 'No posts found.' })).toBeInTheDocument()
    expect(screen.getByText('0 posts found')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Blog post pages' })).not.toBeInTheDocument()
  })

  it('shows useful empty states for no blogs and no posts', () => {
    const { unmount } = renderAt('/blogs', [])
    expect(screen.getByRole('heading', { name: 'No blogs yet.' })).toBeInTheDocument()
    unmount()

    renderAt('/blogs/lukes-blog', [{ ...blogs[0], posts: [] }])
    expect(screen.getByRole('heading', { name: 'No posts yet.' })).toBeInTheDocument()
  })

  it.each([
    ['/blogs/unknown', 'Blog not found.'],
    ['/blogs/lukes-blog/unknown', 'Post not found.'],
    ['/somewhere-else', 'Page not found.'],
  ])('shows a not-found state for %s', (path, title) => {
    renderAt(path)
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument()
  })
})
