import { BoltIcon } from '@heroicons/react/24/solid';

export default function BrandIcon({ className = 'w-6 h-6' }) {
  return (
    <span className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-content p-1.5">
      <BoltIcon className={className} />
    </span>
  );
}