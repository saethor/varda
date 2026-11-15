import { Trans } from '@lingui/react/macro';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@varda/ui/components/card';

export const Route = createFileRoute('/sign-in')({
  component: SignIn,
});

function SignIn() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1 className="text-2xl">
            <Trans>Sign in</Trans>
          </h1>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          <Trans>
            New to Varða?{' '}
            <Link to="/sign-up" className="font-medium text-primary underline underline-offset-4">
              Sign up
            </Link>
          </Trans>
        </p>
      </CardContent>
    </Card>
  );
}
