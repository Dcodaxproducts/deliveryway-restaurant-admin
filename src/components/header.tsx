type HeaderProps = {
  title: string;
  description?: string;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

export default function Header({
  title,
  description,
  className = "",
  titleClassName,
  descriptionClassName,
}: HeaderProps) {
  return (
    <div className={`lg:space-y-[6px] ${className}`}>
      <h1
        className={
          titleClassName ??
          "text-xl lg:text-[32px] font-semibold text-dark lg:leading-[42px]"
        }
      >
        {title}
      </h1>

      {description && (
        <p
          className={
            descriptionClassName ??
            "text-sm lg:text-base text-gray"
          }
        >
          {description}
        </p>
      )}
    </div>
  );
}