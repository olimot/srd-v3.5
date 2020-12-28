import React from 'react';
import fs from 'fs-extra';
import DocumentView from '../../components/DocumentView';

const Post = ({ filename, html }: { filename: string; html: string }) => {
  return <DocumentView filename={filename} html={html as string} />;
};

export async function getStaticPaths() {
  const filenames = (await fs.readdir('./data/html')).filter(a => a.match(/.html$/));
  const paths = filenames.map(a => `/docs/${a.split('.')[0]}`);
  return { paths, fallback: false };
}

export async function getStaticProps({ params }: { params: any }) {
  const filename = decodeURIComponent(params.filename as string);
  const html = await fs.readFile(`./data/html/${filename}.html`, 'utf8');
  return { props: { html, filename } };
}

export default Post;
