import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
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

const renderAt = (path: string, content: Blog[] = blogs) => render(
  <MemoryRouter initialEntries={[path]}>
    <App blogs={content} />
  </MemoryRouter>,
)

describe('blog routes', () => {
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

  it('reveals long blog archives twelve posts at a time', async () => {
    const user = userEvent.setup()
    const posts = Array.from({ length: 13 }, (_, index) => ({
      ...blogs[0].posts[0],
      slug: `post-${index + 1}`,
      title: `Journey ${index + 1}`,
      publishedDate: `2026-07-${String(13 - index).padStart(2, '0')}`,
      media: undefined,
    }))

    renderAt('/blogs/lukes-blog', [{ ...blogs[0], posts }])

    expect(screen.getByRole('heading', { name: 'Journey 12' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Journey 13' })).not.toBeInTheDocument()
    expect(screen.getByText('Showing 12 of 13 posts')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Load more/ }))

    expect(screen.getByRole('heading', { name: 'Journey 13' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Load more/ })).not.toBeInTheDocument()
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
