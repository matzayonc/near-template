#!/bin/bash

rm -rf /tmp/near-sandbox
/opt/nearcore/target/debug/neard-sandbox --home /tmp/near-sandbox init
/opt/nearcore/target/debug/neard-sandbox --home /tmp/near-sandbox run