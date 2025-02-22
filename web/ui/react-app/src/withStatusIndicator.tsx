import React, { ComponentType, FC } from 'react';
import { Alert } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

interface StatusIndicatorProps {
  error?: Error;
  isLoading?: boolean;
  customErrorMsg?: JSX.Element;
}

export const withStatusIndicator = <T extends {}>(Component: ComponentType<T>): FC<StatusIndicatorProps & T> => ({
  error,
  isLoading,
  customErrorMsg,
  ...rest
}) => {
  if (error) {
    return (
      <Alert color="danger">
        {customErrorMsg ? (
          customErrorMsg
        ) : (
          <>
            <strong>Error:</strong> Error fetching {Component.displayName}: {error.message}
          </>
        )}
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <FontAwesomeIcon
        size="3x"
        icon={faSpinner}
        spin
        className="position-absolute"
        style={{ transform: 'translate(-50%, -50%)', top: '50%', left: '50%' }}
      />
    );
  }
  return <Component {...(rest as T)} />;
};
