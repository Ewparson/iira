#include "index/index_caller.h"
#include "network/zmq_pub.h" // from the ZMQ PUB you added

void index_caller_init() {
    zmq_pub_init(); // uses POIC_ZMQ_PUB (default tcp://127.0.0.1:28332)
}

void index_call_tx(const std::string& txid_hex,
                   const std::vector<uint8_t>& raw_tx_bytes) {
    zmq_pub_hashtx(txid_hex);
    zmq_pub_rawtx(raw_tx_bytes);
}

void index_call_block(const std::string& block_hash_hex,
                      const std::vector<uint8_t>& raw_block_bytes) {
    zmq_pub_hashblock(block_hash_hex);
    zmq_pub_rawblock(raw_block_bytes);
}
