#pragma once
#include <string>
#include <vector>

// bind ZMQ PUB once on startup
void index_caller_init();

// call on tx accepted to mempool
void index_call_tx(const std::string& txid_hex,
                   const std::vector<uint8_t>& raw_tx_bytes);

// call right after a block is fully committed to disk/state
void index_call_block(const std::string& block_hash_hex,
                      const std::vector<uint8_t>& raw_block_bytes);










                      