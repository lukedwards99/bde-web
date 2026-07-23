# Trainer Blogs Implementation Decisions

This document records the agreed product and content-model decisions for adding trainer blogs to BDE-web. It is an implementation brief only; the existing BDE-web architecture still needs to be reviewed before development begins.

## Product behavior

- Add a prominent, top-level **Blogs** tab to the main site navigation.
- Support multiple separately named blogs owned by the same trainer.
- Trainers are not required to have a blog.
- Present all named blogs in a flat, responsive grid rather than grouping them by trainer.
- Each blog has a landing page containing its description, trainer name, and posts.
- Each post has its own readable article page with breadcrumbs.
- Sort blogs alphabetically and posts newest-first by publication date.
- Provide useful empty and not-found states.

## Content directory

Blog content should live in a repository-level `blogs/` directory:

```text
blogs/
  lukes-blog/
    blog.json
    posts/
      welcome.json
      welcome.md
```

- Each folder directly under `blogs/` represents one named blog, not one trainer.
- A trainer with multiple blogs has multiple sibling blog folders.
- The blog folder name becomes its URL slug.
- Post metadata and Markdown live in a `posts/` subfolder.
- Each post JSON filename becomes its URL slug.

## Metadata schemas

Each blog folder contains a `blog.json` file:

```json
{
  "title": "Luke's Blog",
  "description": "Notes on training, programming, and building sustainable strength.",
  "trainer": {
    "id": "luke",
    "name": "Luke"
  }
}
```

- `trainer.id` is the stable identity shared by multiple blogs from the same trainer.
- `trainer.name` is the display name and should remain consistent for a given trainer ID.
- A separate master trainer registry is not required for this feature.

Each post has a metadata JSON file that references a sibling Markdown file:

```json
{
  "title": "Welcome to Luke's Blog",
  "summary": "An introduction to the ideas this blog will explore.",
  "publishedDate": "2026-07-22",
  "contentFile": "welcome.md"
}
```

- `publishedDate` uses the `YYYY-MM-DD` format.
- `contentFile` references the Markdown body rather than embedding article content in JSON.
- Every checked-in post is published; drafts and scheduled publication are out of scope.

## Routes and presentation

Use routes equivalent to:

- `/blogs` — flat grid of all named blogs
- `/blogs/:blogSlug` — one blog and its posts
- `/blogs/:blogSlug/:postSlug` — one rendered Markdown post

Blog cards should show the blog title, trainer name, description, and post count. Post cards should show the title, publication date, and summary.

Render standard Markdown safely, including common GitHub-flavored features such as tables and task lists. Do not enable raw HTML. Validate required metadata, dates, duplicate slugs, trainer identity consistency, and Markdown file references, and report content errors clearly.

## Initial sample

Include one clearly labeled sample named **Luke's Blog** with a **Welcome to Luke's Blog** post. The welcome post should briefly introduce the training and programming subjects the blog will cover.

## Explicitly out of scope

- In-app blog editing or a remote CMS
- Drafts and scheduled posts
- Cover images, tags, search, comments, and pagination
- A separate trainer registry created solely for blogs

The repository's later **Luke's Journey** archive is a deliberate exception to
the original cover-image decision: imported Instagram posts may include a
validated media gallery and use its first image as the listing cover. Other
blogs remain text-only unless their metadata explicitly supplies media.

## Validation expectations

Add tests appropriate to BDE-web for navigation, listings, post ordering and metadata, Markdown rendering, breadcrumbs, direct links, invalid slugs, malformed metadata, and missing Markdown references. Confirm the production build and the repository's standard type, lint, and test checks before publishing.
