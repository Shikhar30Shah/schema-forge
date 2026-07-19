import React from 'react';
import type { NextPage } from 'next';
import { SchemaForgeWorkspace } from '../components/SchemaForgeWorkspace';
import { Seo } from '../components/Seo';

const Home: NextPage = () => {
  return (
    <>
      <Seo />
      <SchemaForgeWorkspace />
    </>
  );
};

export default Home;

