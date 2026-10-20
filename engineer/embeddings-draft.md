# SFR Embedding

AutoR&D-Engineer refines Embedding Gemma 2 into two compact models for stronger document retrieval: a research version and a production-supported version. We evaluate both against the pretrained model on MTEB and internal document collections. The internal comparison also includes two independent checkpoints.

**R is the research version; P is the production-supported version.**

## Public benchmark: MTEB (eng, v2)

| Model | MTEB mean, 41 tasks | Retrieval nDCG@10, 10 tasks |
|---|---:|---:|
| Embedding Gemma 2 | 67.30 | 51.07 |
| sfr-embedding-rnd_R | 68.61 (+1.30) | 57.21 (+6.13) |
| sfr-embedding-rnd_P | 68.22 (+0.92) | 55.76 (+4.69) |

Parentheses show changes from Embedding Gemma 2, calculated before rounding. Public scores are on a 0–100 scale and use the same checkpoints as the internal comparison. R improves mean retrieval nDCG@10 by 6.13 points over Embedding Gemma 2, with a 1.30-point increase in the overall mean. Both versions improve over the pretrained baseline in retrieval and the overall MTEB mean.

## Internal retrieval benchmark

| Model / checkpoint | Type | Size | Honda MRR | Honda Recall@10 | Multilingual MRR | Multilingual Recall@10 | Disney MRR | Disney Hit@1 | Disney Recall@10 |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| SFR Embedding Mistral | Independent checkpoint | 7 B | 0.7118 | 0.9132 | 0.7558 | 0.9558 | 0.8409 | 0.7711 | 0.4155 |
| Embedding Gemma 300M | Independent checkpoint | 300 M | 0.7852 | 0.9488 | 0.8625 | 0.9958 | 0.8887 | 0.8313 | 0.4392 |
| Embedding Gemma 2 | Baseline | 271 M | 0.7515 | 0.9385 | 0.8641 | 0.9933 | 0.8622 | 0.8012 | 0.4132 |
| sfr-embedding-rnd_R | Research | 272.6 M | 0.7910 (+0.0395) | 0.9620 (+0.0234) | 0.8777 (+0.0136) | 0.9967 (+0.0033) | 0.9153 (+0.0531) | 0.8735 (+0.0723) | 0.4617 (+0.0485) |
| sfr-embedding-rnd_P | Production | 272.6 M | 0.7939 (+0.0423) | 0.9610 (+0.0224) | 0.8770 (+0.0129) | 0.9958 (+0.0025) | 0.9109 (+0.0487) | 0.8614 (+0.0602) | 0.4262 (+0.0129) |

Scores are on a 0–1 scale. Parentheses show changes from Embedding Gemma 2, calculated before rounding. The R checkpoint leads on six of the seven featured metrics. Its strongest gains over Embedding Gemma 2 appear on Disney support: MRR increases from 0.8622 to 0.9153, and Hit@1 from 0.8012 to 0.8735. The P variant achieves the highest Honda MRR, 0.7939, and improves over Embedding Gemma 2 on every featured metric.

## What the research changed

The research checkpoint combines retrieval cross-entropy with Nemotron ranking distillation along both rows and columns of the query–passage score matrix. A learned projection after native pooling produces 2,048-dimensional embeddings.

The production-supported version uses retrieval supervision and Nemotron teacher scores, with 768-dimensional output. Its fine-tuning data includes HotpotQA, Natural Questions, FEVER, and SQuAD v2. This policy describes the fine-tuning data, rather than the base model’s pretraining data.

These results compare complete training recipes. The R model’s wider vectors change its storage footprint relative to the 768-dimensional base model.

## Evaluation notes

Internal retrieval uses 512-token inputs, BF16 encoders, a batch size of 16, and exhaustive cosine ranking of FP32-normalized vectors. Queries and collections remain fixed across models. Honda and multilingual collections use supplied chunk-level relevance labels; Disney support uses document-level relevance proxies.

Public evaluation uses MTEB 1.38.61, the pinned 41-task suite, restored title/body formatting, and per-task seed 42. All three models in the public comparison use an 8,192-token context limit. Native prompts and pooling conventions are retained.

See the [results record](embeddings/assets/results.json), [internal comparison CSV](embeddings/assets/internal-benchmark.csv), and [interactive report](embeddings/).
