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

    const breadcrumbs = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(within(breadcrumbs).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(within(breadcrumbs).getByRole('link', { name: 'Blogs' })).toHaveAttribute('href', '/blogs')
    expect(within(breadcrumbs).getByRole('link', { name: "Luke's Blog" })).toHaveAttribute(
      'href',
      '/blogs/lukes-blog',
    )
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
