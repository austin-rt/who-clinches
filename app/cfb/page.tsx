import CfbConferenceGrid from '@/app/components/CfbConferenceGrid';

const CfbPage = () => (
  <div className="container mx-auto flex min-h-full flex-col items-center gap-8 px-4 py-12">
    <h1 className="text-2xl font-bold text-base-content">
      College Football Conference Championship Simulator
    </h1>
    <div className="w-full max-w-4xl">
      <CfbConferenceGrid />
    </div>
  </div>
);

export default CfbPage;
