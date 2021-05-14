import fs from 'fs-extra';
import React from 'react';
import DocumentView from '../../components/DocumentView';
import Layout from '../../components/Layout';

const Post = ({ html }: { html: string }) => {
  return (
    <Layout>
      <DocumentView html={html} />
    </Layout>
  );
};

export async function getStaticPaths() {
  const filenames = (await fs.readdir('./public/html')).filter(a => a.match(/.html$/));
  const paths = filenames.map(a => `/docs/${encodeURIComponent(a.replace(/\.html/, ''))}`);
  return { paths, fallback: false };
}

export async function getStaticProps({ params }: { params: any }) {
  const filename = decodeURIComponent(params.filename as string);
  const html = await fs.readFile(`./public/html/${filename}.html`, 'utf8');
  const [, bodyHTML] = html.match(/<body[^>]*>([\s\S]*)<\/body>/) || [];
  return { props: { filename, html: bodyHTML || '' } };
}

export default Post;
