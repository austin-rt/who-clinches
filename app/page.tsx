import { redirect } from 'next/navigation';
import { type CFBConferenceAbbreviation } from '@/lib/constants';

const Home = () => {
  const firstSport = 'cfb';
  const firstConf: CFBConferenceAbbreviation = 'sec';
  redirect(`/${firstSport}/${firstConf}`);
};

export default Home;
