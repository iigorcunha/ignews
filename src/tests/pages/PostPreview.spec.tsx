import { render, screen } from '@testing-library/react';
import { useSession } from 'next-auth/client';
import { useRouter } from 'next/router';
import { mocked } from 'ts-jest/utils';
import PostPreview, { getStaticProps } from '../../pages/posts/preview/[slug]';
import { getPrismicClient } from '../../services/prismic';
import { stripe } from '../../services/stripe';


const post = 
  { 
    slug: 'my-new-post',
    title: 'My New Post',
    content: '<p>Post excerpt<p>',
    updatedAt: 'March, 10'
  }

jest.mock('next-auth/client')
jest.mock('next/router')
jest.mock('../../services/prismic')

describe('PostPreview Page', () => {
  it('renders correctly', () => {

    const useSessionMocked = mocked(useSession);

    useSessionMocked.mockReturnValueOnce([null, false])
    render(<PostPreview post={post} />)

    expect(screen.getByText("My New Post")).toBeInTheDocument()
    expect(screen.getByText("Post excerpt")).toBeInTheDocument()
    expect(screen.getByText("Do you want to continue reading?")).toBeInTheDocument()
  })

  

  it('redirects user to full post when user is subscribed', async () => {

    const useSessionMocked = mocked(useSession)
    const useRouterMocked = mocked(useRouter)
    const pushMock = jest.fn();

    useSessionMocked.mockReturnValueOnce([
      {
      activeSubscription: 'fake-active-subscription'
      }
      , false] as any)
    

    useRouterMocked.mockReturnValueOnce({
      push: pushMock,
    } as any)

    render(<PostPreview post={post} />)

    expect(pushMock).toHaveBeenCalledWith('/posts/my-new-post')
  })

  

  it('load initial data', async () => {
    const getPrismicClientMocked = mocked(getPrismicClient)

    getPrismicClientMocked.mockReturnValueOnce({
      getByUID: jest.fn().mockResolvedValueOnce({
        data: {
          title: [
            { type: 'heading', text: 'My New Post'}
          ],
          content: [
            { type: 'paragraph', text: 'Post excerpt'}
          ],
        },
        last_publication_date: '04-01-2021'
      })
    } as any)
    

    const response = await getStaticProps({
      params: {
        slug: 'my-new-post'
      }
    } as any);

    expect(response).toEqual(
      expect.objectContaining({
        props: {
          post: {
            slug: 'my-new-post',
            title: 'My New Post',
            content: '<p>Post excerpt</p>',
            updatedAt: '01 de abril de 2021'
          }
        }
      })
    )
  })
})