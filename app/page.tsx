import { sortPosts } from 'pliny/utils/contentlayer'
import { allBlogs } from 'contentlayer/generated'
import Main from './Main'

export default async function Page() {
  const posts = sortPosts(allBlogs)
  return <Main posts={posts} />
}
