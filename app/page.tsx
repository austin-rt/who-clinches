import { redirect } from 'next/navigation';
import { sports, type SportSlug, type ConferenceSlug } from '@/lib/constants';

const Home = () => {
  const firstSport = Object.keys(sports)[0] as SportSlug;
  const firstConf = Object.keys(sports[firstSport].conferences)[0] as ConferenceSlug;
  redirect(`/${firstSport}/${firstConf}`);
};

export default Home;
