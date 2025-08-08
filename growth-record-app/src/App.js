import React, { useState } from "react";
import AccountSelector from './AccountSelector';
import GrowthRecord from './GrowthRecord';
import { Container } from "@mui/material";

function App() {
  const [currentAccount, SetCurrentAccount] = useState(null);

  return (<Container>
    {!currentAccount ? (
      <AccountSelector onSelect={SetCurrentAccount} />
    ) : (
      <GrowthRecord accountId={currentAccount.id} accountName={currentAccount.name} />
    )}
  </Container>);
}