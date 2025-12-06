import { redirect } from 'next/navigation';
import { type ConferenceAbbreviation } from '@/lib/constants';

const Home = () => {
  const firstSport = 'cfb';
  const firstConf: ConferenceAbbreviation = 'sec';
  redirect(`/${firstSport}/${firstConf}`);
};

export default Home;
