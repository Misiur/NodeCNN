import os
import data_helpers
import tensorflow as tf
import numpy as np
import json

class MessageHandler(object):
    def __init__(self, sess, graph, vocab_processor):
        self.sess = sess
        self.graph = graph
        self.vocab_processor = vocab_processor

    def handle(self, line):
        self.analyze(json.loads(line))

    def analyze(self, data):
        x_raw = [data_helpers.clean_str(data["text"])]
        x_test = np.array(list(self.vocab_processor.transform(x_raw)))

        print("Input string: \"{}\"".format(data["text"]), flush=True)
        print("Calculating", flush=True)

        # Get the placeholders from the self.graph by name
        input_x = self.graph.get_operation_by_name("input_x").outputs[0]
        # input_y = self.graph.get_operation_by_name("input_y").outputs[0]
        dropout_keep_prob = self.graph.get_operation_by_name("dropout_keep_prob").outputs[0]

        # Tensors we want to evaluate
        predictions = self.graph.get_operation_by_name("output/predictions").outputs[0]

        # Generate batches for one epoch
        all_predictions = self.sess.run(predictions, {input_x: x_test, dropout_keep_prob: 1.0})

        # Save the evaluation to a csv
        predictions_human_readable = np.column_stack((np.array(x_raw), all_predictions))
        stringified = json.dumps({
            "id": data["id"],
            "sentiment": predictions_human_readable[0][1]
        })

        print("ANALYZE {}".format(stringified), flush=True)