export type TrainerIdentity = {
  id: string
  name: string
}

export type BlogPostMedia = {
  type: 'image' | 'video'
  path: string
  alt: string
}

export type BlogPost = {
  slug: string
  title: string
  summary: string
  publishedDate: string
  content: string
  media?: BlogPostMedia[]
}

export type Blog = {
  slug: string
  title: string
  description: string
  trainer: TrainerIdentity
  posts: BlogPost[]
}
