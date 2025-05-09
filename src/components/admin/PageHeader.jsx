
import React from 'react';
import { CardTitle, CardDescription } from "@/components/ui/card";

const PageHeader = ({ title, description, icon, actionButton }) => {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-4 border-b border-border">
      <div className="flex items-center gap-4 mb-4 md:mb-0">
        {icon && <div className="text-primary p-3 bg-primary/10 rounded-lg">{icon}</div>}
        <div>
          <CardTitle className="text-3xl md:text-4xl font-bold text-foreground">{title}</CardTitle>
          {description && <CardDescription className="text-base text-muted-foreground mt-1">{description}</CardDescription>}
        </div>
      </div>
      {actionButton && <div className="self-start md:self-center">{actionButton}</div>}
    </div>
  );
};

export default PageHeader;
