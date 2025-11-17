'use client';

interface HomeAwayBadgeProps {
  type: 'home' | 'away';
}

const HomeAwayBadge = ({ type }: HomeAwayBadgeProps) => {
  return (
    <div
      className={
        type === 'home'
          ? 'badge badge-sm border-0 bg-primary text-primary-content dark:bg-white dark:text-primary'
          : 'badge badge-sm border-0 bg-secondary text-secondary-content dark:bg-[#ffd04033] dark:text-secondary'
      }
    >
      {type === 'home' ? 'Home' : 'Away'}
    </div>
  );
};

export default HomeAwayBadge;

