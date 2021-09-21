/* eslint-disable react-hooks/exhaustive-deps */
import "../shim";
import Web3 from "web3";
import "../shim";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import { Header } from "./Components/header";

// import { Main } from "./Components/Main";
import { Loader } from "./Components/loader";
import HDWalletProvider from "@truffle/hdwallet-provider";
import { PRIVATE_KEYS, PROVIDER } from "./constants";
// import { FormHeader } from "./Components/FormHeader";
// import { Form } from "./Components/Form.tsx";
import ElectionAbi from "./abis//Election.json";
import { Picker } from "@react-native-picker/picker";
function App() {
  const [account, setAccount] = useState("");
  const [electionContract, setElectionContract] = useState("");
  const [candidates, setCandidates] = useState<Array<any>>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Number>(1);

  const [loader, setLoader] = useState(false);

  var hdWalletProvider = new HDWalletProvider({
    privateKeys: PRIVATE_KEYS,
    providerOrUrl: PROVIDER,
    numberOfAddresses: 1,
  });
  var web3 = new Web3(hdWalletProvider);
  useEffect(() => {
    setLoader(true);
    const init = async () => {
      await loadBlockChainData();
    };
    init();
  }, []);

  async function loadBlockChainData() {
    console.log("Load Block Data ===> "); // Init Web3 Block Chain
    let accounts = await web3.eth.getAccounts();
    console.log("Accounts Address ====> ", accounts);
    let balance = await web3.eth.getBalance(accounts[1]);
    console.log("balance === > ", balance);
    setAccount(accounts[1]);

    // set election Contract

    const networkID = await web3.eth.net.getId();

    const electionData = ElectionAbi.networks[networkID];

    if (electionData) {
      const electionAbi = ElectionAbi.abi;
      const address = electionData.address;
      const electionContract = new web3.eth.Contract(electionAbi, address);
      setElectionContract(electionContract);
      // set Candidates Data
      let candidatesArray: Array<any> = [];

      let candidatesCounts = await electionContract.methods.candidatesCount().call();

      for (let i = 0; i < candidatesCounts; i++) {
        let candidates = await electionContract.methods.candidates(i + 1).call();

        if (candidates) {
          candidatesArray.push(candidates);
        }
      }
      setCandidates(candidatesArray);
    }

    setLoader(false);
  }

  async function vote(id: Number) {
    setLoader(true);
    await electionContract.methods
      .vote(id)
      .send({ from: account })
      .on("confirmation", async (confirmation) => {
        if (confirmation === 1) {
          await loadBlockChainData();
        }
      })
      .on("error", (error) => {
        setLoader(false);
        alert(error + " Existing Vote");
      });
  }

  console.log("selectedCandidate", selectedCandidate);

  return (
    <SafeAreaView style={{ flex: 1, alignItems: "center" }}>
      <Header title={"Voting System"} accountAddress={account} />
      <Loader isLoading={loader} />

      <View style={{ width: "100%", height: "100%", alignItems: "center" }}>
        <View style={{ height: "15%", width: "100%", justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontWeight: "bold", fontSize: 22 }}>{"Election Results"}</Text>
        </View>
        <View style={{ height: "70%", justifyContent: "flex-start", alignItems: "center", width: "100%" }}>
          {renderHeaderRow()}

          <FlatList
            data={candidates}
            renderItem={(item) => {
              return (
                <View
                  style={{
                    paddingHorizontal: 40,
                    paddingVertical: 10,
                    width: "100%",
                    flexDirection: "row",
                    justifyContent: "flex-start",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ width: "10%", fontSize: 17 }}>{item.item.id}</Text>
                  <Text style={{ width: "60%", fontSize: 17 }}>{item.item.name}</Text>
                  <Text style={{ width: "30%", fontSize: 17 }}>{item.item.voteCount}</Text>
                </View>
              );
            }}
          />

          <View style={{ height: "5%", width: "100%", justifyContent: "center", alignItems: "center" }}>
            <Text style={{ fontWeight: "bold", fontSize: 19 }}>{"Select Candidate"}</Text>
          </View>

          <Picker
            style={{ width: "100%" }}
            selectedValue={selectedCandidate}
            onValueChange={(itemValue, itemIndex) => setSelectedCandidate(itemValue)}
          >
            {candidates.length !== 0 &&
              candidates.map((item: { name: string | undefined; id: any }) => {
                return <Picker.Item label={item.name} value={item.id} />;
              })}
          </Picker>

          <TouchableOpacity
            onPress={() => {
              vote(selectedCandidate);
            }}
            style={{
              width: "50%",
              height: "10%",
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 20,
              backgroundColor: "black",
              marginTop: 10,
            }}
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>{"VOTE!"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function renderHeaderRow() {
  return (
    <View
      style={{
        paddingHorizontal: 40,
        paddingVertical: 10,
        width: "100%",
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
      }}
    >
      <Text style={{ width: "10%", fontWeight: "bold", fontSize: 18 }}>{"#"}</Text>
      <Text style={{ width: "60%", fontWeight: "bold", fontSize: 18 }}>{"Name"}</Text>
      <Text style={{ width: "30%", fontWeight: "bold", fontSize: 18 }}>{"Votes"}</Text>
    </View>
  );
}

export default App;
